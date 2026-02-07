import os
import json
import random
from typing import List, Dict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
from unstructured.partition.pdf import partition_pdf

load_dotenv(override=True)

# CONFIG
UPLOAD_ROOT = "uploads"
DATA_ROOT = "data"
ASSESSMENT_DIR = os.path.join(DATA_ROOT, "assessments")
PROGRESS_FILE = os.path.join(DATA_ROOT, "user_progress.json")

os.makedirs(ASSESSMENT_DIR, exist_ok=True)

# Initialize Gemini
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.3)

def get_session_text(session_id: str) -> str:
    """
    Extracts text from all PDFs in the session directory.
    Uses unstructured (fast strategy) for speed.
    """
    session_dir = os.path.join(UPLOAD_ROOT, session_id)
    if not os.path.exists(session_dir):
        return ""

    full_text = ""
    for filename in os.listdir(session_dir):
        if filename.lower().endswith(".pdf"):
            file_path = os.path.join(session_dir, filename)
            try:
                elements = partition_pdf(filename=file_path, strategy="fast")
                full_text += "\n".join([str(e) for e in elements])
            except Exception as e:
                print(f"Error parsing {filename}: {e}")
    
    return full_text[:50000] # Limit context window for safety

def get_assessment_prompt(level: int, context: str) -> str:
    if level == 1:
        return f"""
        You are an educational AI. Create a Level 1 Assessment (Recall & Understanding) based on the text below.
        
        Rules:
        1. Generate 10 Multiple Choice Questions (MCQs).
        2. Focus strictly on DEFINITIONS, DIRECT FACTS, and basic UNDERSTANDING from the text.
        3. Do not ask complex analysis questions yet.
        4. Provide 4 options for each question.
        5. Output JSON format only.

        Text Context:
        {context}

        Output JSON format:
        [
            {{
                "id": 1,
                "question": "What is...",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "explanation": "Brief explanation of why A is correct."
            }},
            ...
        ]
        """
    elif level == 2:
        return f"""
        You are an educational AI. Create a Level 2 Assessment (Application & Analysis) based on the text below.
        
        Rules:
        1. Generate 10 Multiple Choice Questions (MCQs).
        2. Focus on SCENARIOS, CASE STUDIES, and APPLICATION of concepts.
        3. Questions should start like "A student observes that..." or "If X happens...", asking the user to apply knowledge.
        4. Provide 4 options for each question.
        5. Output JSON format only.

        Text Context:
        {context}

        Output JSON format:
        [
            {{
                "id": 1,
                "question": "Scenario...",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "B",
                "explanation": "Brief explanation of why B is correct in this scenario."
            }},
            ...
        ]
        """
    elif level == 3:
        return f"""
        You are an educational AI. Create a Level 3 Assessment (Creation & Evaluation) based on the text below.
        
        Rules:
        1. Generate 5 Short Answer / Thought-Provoking Questions.
        2. Focus on "Create a solution", "Critique this method", "Propose an alternative".
        3. These are Open-Ended questions requiring synthesis of newer case studies or concepts.
        4. Output JSON format only.

        Text Context:
        {context}

        Output JSON format:
        [
            {{
                "id": 1,
                "question": "Propose a method to...",
                "type": "short_answer",
                "explanation": "Key elements that should be in the student's answer."
            }},
            ...
        ]
        """
    return ""

def generate_assessment(session_id: str, level: int):
    # 1. Check Cache
    cache_file = os.path.join(ASSESSMENT_DIR, f"{session_id}_lvl{level}.json")
    if os.path.exists(cache_file):
        with open(cache_file, "r") as f:
            return json.load(f)

    # 2. Get Text
    context = get_session_text(session_id)
    if not context:
        return {"error": "No documents found for this session."}

    # 3. Generate
    prompt = get_assessment_prompt(level, context)
    messages = [HumanMessage(content=prompt)]
    
    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        
        # Clean Markdown
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
            
        assessment_data = json.loads(content)
        
        # Add metadata like timer
        result = {
            "level": level,
            "timer_seconds": 600, # 10 minutes for all levels
            "questions": assessment_data
        }
        
        # Save to Cache
        with open(cache_file, "w") as f:
            json.dump(result, f, indent=4)
            
        return result
        
    except Exception as e:
        print(f"Assessment Generation Failed: {e}")
        return {"error": "Failed to generate assessment."}

def load_user_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_user_progress(progress):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=4)

def submit_assessment_result(session_id: str, level: int, score: int, max_score: int, mistakes: List[Dict] = None):
    progress = load_user_progress()
    
    if session_id not in progress:
        progress[session_id] = {"xp": 0, "unlocked_level": 1, "history": [], "mistakes": []}
    
    if "mistakes" not in progress[session_id]:
        progress[session_id]["mistakes"] = []
        
    user_data = progress[session_id]
    
    # Calculate XP
    xp_gained = 0
    passed = False
    
    # Bloom's Logic & Thresholds
    if level == 1:
        if score >= 8: 
            xp_gained = random.randint(50, 100)
            passed = True
            if user_data["unlocked_level"] < 2:
                user_data["unlocked_level"] = 2
                
    elif level == 2:
        if score >= 7:
            xp_gained = random.randint(100, 150)
            passed = True
            if user_data["unlocked_level"] < 3:
                user_data["unlocked_level"] = 3
                
    elif level == 3:
        if score > 0: 
            xp_gained = random.randint(150, 200)
            passed = True

    if passed:
        user_data["xp"] += xp_gained
    
    # Update History
    user_data["history"].append({
        "level": level,
        "score": score,
        "max_score": max_score,
        "passed": passed,
        "xp_gained": xp_gained,
        "timestamp": str(os.path.getmtime(PROGRESS_FILE) if os.path.exists(PROGRESS_FILE) else 0) 
    })

    # Update Mistakes
    if mistakes:
        for m in mistakes:
            # Check if mistake already exists to avoid duplicates
            if not any(dm["question"] == m["question"] for dm in user_data["mistakes"]):
                user_data["mistakes"].append({
                    "question": m["question"],
                    "correct_answer": m.get("correct_answer"),
                    "explanation": m.get("explanation"),
                    "user_answer": m.get("user_answer"),
                    "level": level,
                    "comments": "",
                    "timestamp": str(os.path.getmtime(PROGRESS_FILE) if os.path.exists(PROGRESS_FILE) else 0)
                })
    
    save_user_progress(progress)
    
    return {
        "passed": passed,
        "xp_gained": xp_gained,
        "new_total_xp": user_data["xp"],
        "unlocked_level": user_data["unlocked_level"],
        "score": score
    }

def get_mistakes(session_id: str):
    progress = load_user_progress()
    if session_id == "all":
        all_mistakes = []
        for sid, data in progress.items():
            if isinstance(data, dict) and "mistakes" in data:
                # Add session_id to each mistake for context in global view
                for m in data["mistakes"]:
                    m_with_sid = m.copy()
                    m_with_sid["session_id"] = sid
                    all_mistakes.append(m_with_sid)
        return all_mistakes
        
    if session_id not in progress:
        return []
    return progress[session_id].get("mistakes", [])

def update_mistake_comment(session_id: str, question_text: str, comment: str):
    progress = load_user_progress()
    if session_id in progress and "mistakes" in progress[session_id]:
        for m in progress[session_id]["mistakes"]:
            if m["question"] == question_text:
                m["comments"] = comment
                save_user_progress(progress)
                return True
    return False

def get_progress(session_id: str):
    progress = load_user_progress()
    return progress.get(session_id, {"xp": 0, "unlocked_level": 1, "history": []})
