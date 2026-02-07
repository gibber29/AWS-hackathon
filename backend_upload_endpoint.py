from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Form
from typing import List
import os
import shutil
import uuid
import json # Added json import as it's used later in the code

from ingestion_pipeline import ingest_directory
from retrieval_service import get_doubt_assistant_response

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel # Added pydantic BaseModel as it's in the provided snippet

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; refine this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# CONFIG
# ----------------------------
UPLOAD_ROOT = "uploads"
ALLOWED_EXTENSIONS = {".pdf"}

os.makedirs(UPLOAD_ROOT, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

# ----------------------------
# HELPERS
# ----------------------------
def is_allowed_file(filename: str) -> bool:
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)

# ----------------------------
# STATUS ENDPOINTS
# ----------------------------

@app.get("/")
async def root():
    return {
        "message": "Study Assistant Bot API is running!",
        "docs": "/docs",
        "endpoints": {
            "upload": "/upload (POST)",
            "status": "/health (GET)"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "study-assistant-ingestion"}

# ----------------------------
# DOUBT ASSISTANT ENDPOINT
# ----------------------------

@app.post("/ask")
async def ask_question(session_id: str, query: str, language: str = "english"):
    print(f"📥 /ask Request - Session: {session_id}, Query: {query}, Lang: {language}")
    """
    Endpoint for the Student Portal Doubt Assistant.
    """
    try:
        response = get_doubt_assistant_response(query, session_id, language)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------
# UPLOAD ENDPOINT
# ----------------------------

@app.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    session_id: str = Form("default"),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # Use provided session_id or 'default'
    session_dir = os.path.join(UPLOAD_ROOT, session_id)

    os.makedirs(session_dir, exist_ok=True)

    saved_files = []
    rejected_files = []

    for file in files:
        if not is_allowed_file(file.filename):
            rejected_files.append(file.filename)
            continue

        file_path = os.path.join(session_dir, file.filename)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            saved_files.append(file.filename)

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file {file.filename}: {str(e)}"
            )

    if not saved_files:
        raise HTTPException(
            status_code=400,
            detail="No valid PDF files were uploaded"
        )

    # Trigger ingestion in background
    try:
        background_tasks.add_task(ingest_directory, session_dir)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start ingestion: {str(e)}"
        )

    return {
        "session_id": session_id,
        "status": "processing",
        "uploaded_files": saved_files,
        "rejected_files": rejected_files
    }

# ----------------------------
# ASSESSMENT ENDPOINTS
# ----------------------------

class AssessmentRequest(BaseModel):
    session_id: str
    level: int

class SubmitRequest(BaseModel):
    session_id: str
    level: int
    score: int
    max_score: int
    mistakes: List[dict] = []

@app.get("/api/classrooms")
async def get_classrooms():
    """List all available classrooms (uploaded sessions)."""
    if not os.path.exists(UPLOAD_ROOT):
        return {"classrooms": []}
    
    classrooms = []
    for name in os.listdir(UPLOAD_ROOT):
        path = os.path.join(UPLOAD_ROOT, name)
        if os.path.isdir(path):
            classrooms.append(name)
    return {"classrooms": classrooms}

@app.post("/api/assessment/generate")
async def generate_assessment_endpoint(request: AssessmentRequest):
    """Generate or retrieve an assessment for a specific level."""
    from assessment_service import generate_assessment
    result = generate_assessment(request.session_id, request.level)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@app.post("/api/assessment/submit")
async def submit_assessment_endpoint(request: SubmitRequest):
    """Submit results and calculate XP/Unlocks."""
    from assessment_service import submit_assessment_result
    result = submit_assessment_result(
        request.session_id, 
        request.level, 
        request.score, 
        request.max_score,
        request.mistakes
    )
    return result

@app.get("/api/mistakes/{session_id}")
async def get_mistakes_endpoint(session_id: str):
    """Get list of mistakes for a student in a specific classroom."""
    from assessment_service import get_mistakes
    return get_mistakes(session_id)

class CommentRequest(BaseModel):
    session_id: str
    question: str
    comment: str

@app.post("/api/mistakes/comment")
async def add_mistake_comment(request: CommentRequest):
    """Add or update a comment on a specific mistake."""
    from assessment_service import update_mistake_comment
    success = update_mistake_comment(request.session_id, request.question, request.comment)
    if not success:
        raise HTTPException(status_code=404, detail="Mistake not found")
    return {"status": "success"}

@app.get("/api/progress/{session_id}")
async def get_progress_endpoint(session_id: str):
    """Get current XP and unlocked levels for a student in a specific classroom."""
    from assessment_service import get_progress
    return get_progress(session_id)

# ----------------------------
# TEACHER REVIEW ENDPOINT
# ----------------------------

@app.post("/teacher_review")
async def save_teacher_review(data: dict):
    """
    Endpoint for teachers to send feedback to the AI (Text-only fallback).
    """
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
        
    session_dir = os.path.join(UPLOAD_ROOT, session_id)
    os.makedirs(session_dir, exist_ok=True)
    
    review_path = os.path.join(session_dir, "teacher_review.json")
    
    try:
        with open(review_path, "w") as f:
            json.dump(data, f, indent=4)
        return {"status": "success", "message": "Teacher review saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload_review")
async def upload_review(
    background_tasks: BackgroundTasks,
    session_id: str = Form(...),
    assessment_focus: str = Form(""),
    student_gaps: str = Form(""),
    file: UploadFile = File(None)
):
    """
    Endpoint for teachers to send feedback including documents.
    Triggers RAG ingestion in the background.
    """
    session_dir = os.path.join(UPLOAD_ROOT, session_id)
    os.makedirs(session_dir, exist_ok=True)
    
    review_data = {
        "session_id": session_id,
        "assessment_focus": assessment_focus,
        "student_gaps": student_gaps,
        "has_document": False
    }

    if file:
        file_path = os.path.join(session_dir, "teacher_review_document.pdf")
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            review_data["has_document"] = True
            review_data["document_path"] = file_path
            
            # Trigger ingestion for RAG
            background_tasks.add_task(ingest_directory, session_dir)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save review document: {str(e)}")

    review_path = os.path.join(session_dir, "teacher_review.json")
    try:
        with open(review_path, "w") as f:
            json.dump(review_data, f, indent=4)
        return {"status": "success", "message": "Teacher review saved and processing started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
