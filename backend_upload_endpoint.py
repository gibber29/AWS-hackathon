from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from typing import List
import os
import shutil
import uuid

from ingestion_pipeline import ingest_directory
from retrieval_service import get_doubt_assistant_response

from fastapi.middleware.cors import CORSMiddleware

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
async def ask_question(session_id: str, query: str):
    """
    Endpoint for the Student Portal Doubt Assistant.
    """
    try:
        response = get_doubt_assistant_response(query, session_id)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------
# UPLOAD ENDPOINT
# ----------------------------

@app.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    session_id: str = "default",
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
