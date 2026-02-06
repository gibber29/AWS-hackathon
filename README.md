# C.O.T.E.ai 🎓🤖

**C.O.T.E.ai** stands for Classroom of the Elite. It is an AI-powered classroom platform designed to maximize student potential and streamline teacher workflows. It provides a high-fidelity, intelligent environment where educational materials transform into interactive learning experiences.

## 🚀 Vision
C.O.T.E.ai bridges the gap between traditional teaching and personal AI tutoring, providing teachers with powerful management tools and students with dynamic, adaptive learning materials.

## ✨ Features

### 👨‍🏫 Teacher Portal
- **Material Management**: Seamlessly upload and organize educational PDFs for your classes.
- **Performance Overview**: Track student progress and performance metrics at a glance.
- **Classroom Insights**: View and manage the list of students present in your virtual classroom.

### 🎓 Student Portal
- **Live Document Summaries**: Instant access to key takeaways from uploaded materials.
- **Summarized Flashcards**: Personalized cards generated for "last-second revision" and efficient active recall.
- **Dynamic Adaptive Tests**: Quizzes that evolve to increase the student's level to their maximum potential.
- **C.O.T.E.ai Doubt Assistant**: A premium, glassmorphism-styled floating chatbot for instant doubt clarification using RAG.

## 🏗️ Project Structure

```text
.
├── frontend/             # Vite + React (TypeScript + Tailwind CSS 4)
│   ├── src/app/          # Core layout and role selection
│   ├── src/components/   # Navbar, Sidebar, Chatbot, etc.
│   └── src/styles/       # Design system and theme configuration
├── api/                  # FastAPI Backend (Python)
│   ├── ingestion_pipeline.py  # Advanced PDF processing and ingestion
│   ├── retrieval_service.py   # RAG-based query engine using Gemini 2.0 Flash
│   └── backend_upload_endpoint.py # API endpoints for file and session management
├── chroma_db/            # Vector database for high-speed retrieval
└── uploads/              # Storage for classroom materials
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 20+
- Google Gemini API Key

### Setting up the Backend
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: .\venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your `.env` file:
   ```text
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```
4. Start the API:
   ```bash
   uvicorn backend_upload_endpoint:app --reload
   ```

### Setting up the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS 4, Lucide React, Framer Motion.
- **Backend**: FastAPI, LangChain, ChromaDB, Hugging-face embeddings.
- **AI Engine**: **Google Gemini 2.0 Flash** (Model of choice for speed and reasoning).

## 📄 License
MIT License
