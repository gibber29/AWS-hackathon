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
- **Gamified Assessment System**: 
  - Three progressive difficulty levels (Recall, Apply, Create) with XP-based rewards
  - Real-time feedback with instant XP notifications (+10 XP for correct answers)
  - Automated transitions between questions for seamless testing experience
  - Detailed post-assessment analytics showing correct answers, mistakes, and total XP earned
- **Mistakes Repository**: 
  - Comprehensive tracking of all incorrect answers across assessments
  - AI-generated explanations for each mistake
  - Personal comment/note system for self-reflection and learning
  - Global mistakes view aggregating errors from all classroom sessions
- **Live Progress Dashboard**: Track your XP growth, weekly improvement metrics, and review recent mistakes
- **Multi-language Support**: Flashcards and AI revision available in **English, Hindi, Telugu, and Hinglish**.
- **C.O.T.E.ai Doubt Assistant**: A premium, glassmorphism-styled floating chatbot for instant doubt clarification using RAG.

### 👤 Individual Learner Section
- **Personalized Roadmaps**: AI-generated learning paths based on your specific goals and timeline.
- **Daily Learning Objectives**: Day-by-day breakdown of topics with integrated YouTube resources.
- **In-depth Reference Material**: Rich, comprehensive learning content provided for every day of the roadmap.
- **Progress Tracking**: Holistic view of roadmap completion and quiz performance.

### 🛠️ Personalization & RAG Refinement
- **Teacher Review Documents**: Teachers can upload supplementary notes or feedback to refine the AI's understanding of specific student gaps.
- **Dynamic Context Injection**: AI responses are grounded in both core materials and personalized teacher guidance.

## 🏗️ Project Structure

```text
.
├── frontend/             # Vite + React (TypeScript + Tailwind CSS 4)
│   ├── src/app/          # Core layout and role selection
│   ├── src/components/   # Navbar, Sidebar, Chatbot, etc.
│   └── src/styles/       # Design system and theme configuration
├── main.py               # Main FastAPI entry point and API routes
├── ingestion_pipeline.py  # Advanced PDF processing and ingestion
├── retrieval_service.py   # RAG-based query engine using Gemini 2.0 Flash
├── roadmap_service.py     # AI Roadmap generation and management
├── assessment_service.py  # Gamified quiz engine and state management
├── flashcard_service.py   # Multi-language flashcard generation
├── data/                  # Persistent data storage (roadmaps, assessments, progress)
├── chroma_db/            # Vector database for high-speed retrieval
└── uploads/              # Storage for classroom materials and teacher reviews
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
   uvicorn main:app --reload
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
MIT License
