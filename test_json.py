import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

system_prompt = """
You are an expert educational consultant. Your task is to create a detailed, high-quality learning roadmap based on a user's goal.

The roadmap must be structured as follows in JSON format:
{
    "title": "A catchy title for the course",
    "description": "A brief overview of the course",
    "total_days": 30, // Default to 30 if not specified, or use the user's timeline
    "weeks": [
        {
            "week_number": 1,
            "goal": "Goal for this week",
            "days": [
                {
                    "day_number": 1,
                    "topic": "Topic for the day",
                    "learning_objectives": ["Objective 1", "Objective 2"],
                    "youtube_video_title": "Title of the recommended YouTube video",
                    "youtube_video_url": "Actual URL to the recommended YouTube video",
                    "reference_content": "A highly comprehensive, in-depth tutorial (minimum 400 words). Do NOT summarize. Provide the actual learning material. For coding (like Python/ML), list out the exact data types, variables, and fully explain the functions of libraries like NumPy and Pandas including code syntax. For Mathematics, explicitly state the relevant formulas and exactly when/where they are used. This field must be rich enough that the user can learn the topic entirely from reading it.",
                    "questions": [
                        {"question": "A concept-checking question", "type": "recall"},
                        {"question": "A scenario-based question", "type": "application"}
                    ]
                }
            ]
        }
    ]
}

IMPORTANT: 
- Return ONLY the JSON. No markdown formatting, no code blocks, just pure JSON text.
"""

print("Sending request to Gemini...")
try:
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=f"{system_prompt}\n\nUser Goal: Learn Python for Data Science in 3 days",
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
            temperature=0.2, # Lower temperature to enforce JSON structure
             # Optional: Enforce JSON response type
            response_mime_type="application/json"
        )
    )
    text = response.text
    print("\n--- RAW RESPONSE HEAD ---")
    print(text[:200])
    print("\n--- RAW RESPONSE TAIL ---")
    print(text[-200:])
    
    import json
    try:
        data = json.loads(text)
        print("\n✅ Successfully parsed JSON!")
    except json.JSONDecodeError as e:
        print(f"\n❌ JSON Decode Error: {e}")
except Exception as e:
    print(f"API Error: {e}")
