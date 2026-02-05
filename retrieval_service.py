import os
import json
from typing import List, Dict
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import HumanMessage, SystemMessage
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from dotenv import load_dotenv

load_dotenv(override=True)

# --- CONFIG ---
CHROMA_PATH = "./chroma_db"
LOCAL_EMBEDDINGS = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
# Temperature set to 0.2 for creative analogies while staying grounded
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    before_sleep=lambda retry_state: print(f"⚠️ API Limit hit (Retrieval). Retrying in {retry_state.next_action.sleep} seconds...")
)
def generate_ai_response(messages):
    try:
        return llm.invoke(messages)
    except Exception as e:
        print(f"DEBUG: API call failed with error: {str(e)}")
        # If it's a 429, we want to know the EXACT message (e.g., TPM, RPM, or Account limit)
        raise e

SYSTEM_PROMPT = """
You are a friendly, expert Study Assistant Bot. Your goal is to help students understand complex topics from their teacher's uploaded materials.

Rules for your response:
1. **Explanation Structure**: For every key concept or topic you explain, you MUST follow this internal logic, but **DO NOT use labels like "Step A" or "Step B" in your final response**:
   - **First**: Provide a precise, technical definition directly from the teacher's provided context. Quote the text or summarize it accurately without simplification.
   - **Second**: Transition naturally (e.g., "In simpler terms..." or "Think of it like this...") into an intuitive, layman explanation using your educational tone and analogies.
2. **Educational Tone**: Speak like a supportive teacher. Use analogies and metaphors only *after* providing the formal technical definition.
3. **Context First**: Primary information MUST come from the provided PDF context. Use it for the initial formal definition.
4. **Higher-Order Thinking (Bloom's Taxonomy)**:
   - **Application**: Always end your explanation with a "Brain Teaser" or "Apply It" scenario that asks the student to use the concept in a new situation.
   - **Synthesis**: If multiple topics or sections are retrieved, explain how they fit together into the "Big Picture".
   - **Reasoning Hints**: If the student asks a "Why" or "How" question, provide a subtle hint that guides them toward the answer before or alongside the full explanation.
5. **Summarization Queries**: If the user asks for "main concepts" or an "overview", prioritize identifying the central theme or architecture described in the documents first, then move to details, applying the [Formal -> Intuitive] flow for each.
6. **Broaden Knowledge (+1 Logic)**: If relevant, add a small piece of related common knowledge that helps explain the concept better. Keep it simple.
7. **Visual Aids**: Use Mermaid.js flowchart syntax for processes or hierarchies. 
8. **Formatting**: Use bold text for key terms and bullet points. Do not include internal structural tags or step indices in the text.
9. **Analogies**: Always provide at least one analogy for complex concepts.
"""

def get_doubt_assistant_response(query: str, session_id: str):
    """
    Main retrieval pipeline for the Doubt Assistant.
    """
    # 1. Connect to DB
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=LOCAL_EMBEDDINGS,
        collection_name="hackathon_collection"
    )

    # 2. Retrieve relevant chunks (filtered by session_id)
    # Using MMR (Max Marginal Relevance) with k=8 to get a diverse set of chunks 
    # across different sections (e.g., Architecture, Attention, Results)
    results = db.max_marginal_relevance_search(
        query, 
        k=8, 
        fetch_k=20, 
        lambda_mult=0.5, 
        filter={"session_id": session_id}
    )
    
    if not results:
        return "I'm sorry, I couldn't find any information related to that in your uploaded documents. Could you try rephrasing or asking about a different topic?"

    # 3. Format Context
    context_text = ""
    for i, doc in enumerate(results):
        context_text += f"\n--- SOURCE CHUNK {i+1} ---\n{doc.page_content}\n"

    # 4. Generate Response
    student_prompt = f"""
    USER QUESTION: {query}

    TEACHER'S PROVIDED CONTEXT:
    {context_text}

    Please explain this to the student using the rules provided in your system prompt.
    """

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=student_prompt)
    ]

    response = generate_ai_response(messages)
    return response.content

if __name__ == "__main__":
    pass
