from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv

load_dotenv()

# API insists on 'google_search', let's see if LangChain 4.2.1 handles it now
try:
    print("Testing LangChain with google_search...")
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        tools=[{"google_search": {}}]
    )
    print("Success: ChatGoogleGenerativeAI accepted 'google_search' in tools parameter.")
    if os.getenv("GOOGLE_API_KEY"):
        # No actual invoke to save tokens/quota
        pass
except Exception as e:
    print(f"Failure: ChatGoogleGenerativeAI rejected 'google_search' in tools: {e}")

try:
    print("Testing LangChain with google_search inside model_kwargs...")
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        model_kwargs={"tools": [{"google_search": {}}]}
    )
    print("Success: ChatGoogleGenerativeAI accepted 'google_search' in model_kwargs.")
except Exception as e:
    print(f"Failure: ChatGoogleGenerativeAI rejected 'google_search' in model_kwargs: {e}")
