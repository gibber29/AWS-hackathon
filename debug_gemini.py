import google.generativeai as genai
from google.generativeai import types
import os
from dotenv import load_dotenv

load_dotenv()

configs = [
    # SDK said: Unknown field for FunctionDeclaration: google_search
    {'tools': [{'google_search': {}}]},
    # SDK said: ValueError: The only string that can be passed as a tool is 'code_execution'...
    {'tools': ['google_search']},
    # Trying dictionary with google_search_retrieval (API said: not supported, please use google_search)
    {'tools': [{'google_search_retrieval': {}}]},
    # Trying Tool object (if Tool exists)
    {'tools': [types.Tool(google_search={})]} if hasattr(types, 'Tool') else None,
    # Trying google_search as a string in a different way?
    {'tools': [{'google_search': {}}]},
    # What if it's just 'google_search' in a list of dicts but with a different key?
    {'tools': [{'google_search': {}}]}
]

for cfg in configs:
    if cfg is None: continue
    try:
        print(f"Testing config: {cfg}")
        model = genai.GenerativeModel('gemini-2.0-flash', **cfg)
        print(f"Successfully initialized model with {cfg}")
        
        # Test a simple generation to check server-side
        if os.getenv("GOOGLE_API_KEY"):
            try:
                # Use a very small prompt
                resp = model.generate_content("hi", generation_config={"max_output_tokens": 10})
                print(f"SUCCESS: Server accepted {cfg}")
                break # Found it!
            except Exception as se:
                print(f"Server-side failure with {cfg}: {se}")
    except Exception as e:
        print(f"Client-side failure with {cfg}: {e}")

# Check Tool and GoogleSearch types again carefully
print("Searching for any 'Search' or 'Grounding' in types...")
print([a for a in dir(types) if 'search' in a.lower() or 'ground' in a.lower()])
