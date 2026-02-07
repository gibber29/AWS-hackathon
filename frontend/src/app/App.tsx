import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { MaterialView } from './components/MaterialView';
import { Chatbot } from './components/Chatbot';
import { StudentProgressView } from './components/StudentProgressView';
import { AssessmentPathView } from './components/AssessmentPathView';
import { LoginView } from './components/LoginView';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

import { useEffect } from 'react';

export interface Material {
    id: string;
    title: string;
    url: string;
    type: 'pdf';
    date: string;
    description?: string; // For post content
}

export interface Topic {
    id: string;
    title: string;
    description: string;
    materials: Material[];
    pdfUrl?: string; // Keeping optional for backwards compatibility during migration
    flashcards: { id: string; question: string; answer: string }[];
    questions: { id: string; question: string; options: string[]; correctAnswer: number }[];
    enrolledStudentIds?: string[];
    teacherId?: string;
    enrollmentCode?: string;
}

export default function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
    const [topics, setTopics] = useState<Record<string, Topic>>(() => {
        const saved = localStorage.getItem('cote_topics');
        if (!saved) return {};

        try {
            const parsed = JSON.parse(saved);
            // Migration Logic: Convert legacy pdfUrl to materials array
            Object.keys(parsed).forEach(key => {
                const topic = parsed[key];
                if (!topic.materials) topic.materials = [];

                // If there's a legacy PDF and no materials yet, migrate it
                if (topic.pdfUrl && topic.materials.length === 0) {
                    topic.materials.push({
                        id: Math.random().toString(36).substring(2, 9),
                        title: 'Course Material (Legacy)',
                        url: topic.pdfUrl,
                        type: 'pdf',
                        date: new Date().toISOString(),
                        description: 'Materials uploaded previously.'
                    });
                    // distinct delete to avoid TS issues if strictly typed, but here it's any at runtime
                    delete topic.pdfUrl;
                }
            });
            return parsed;
        } catch (e) {
            console.error("Failed to migrate data", e);
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem('cote_topics', JSON.stringify(topics));
    }, [topics]);

    const handleSelectTopic = (id: string) => {
        setSelectedTopicId(id);
    };

    const handleBackToDashboard = () => {
        setSelectedTopicId(null);
    };

    const handleCreateClassroom = (name: string, batch?: string, grade?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        const newTopic: Topic = {
            id,
            title: name,
            description: `${grade} - ${batch}`,
            materials: [],
            flashcards: [],
            questions: [],
            enrollmentCode: code,
            teacherId: 'teacher-1'
        };
        setTopics(prev => ({ ...prev, [id]: newTopic }));
        return code;
    };

    const handleJoinClassroom = (code: string) => {
        const topicId = Object.keys(topics).find(id => topics[id].enrollmentCode === code.toUpperCase());
        if (topicId) {
            // In a real app we'd add the student ID to the topic's enrolled list
            // For this prototype, we'll just return true to indicate success
            return true;
        }
        return false;
    };

    const handleUploadComplete = (topicId: string, fileName: string) => {
        const pdfUrl = `http://localhost:8000/uploads/${topicId}/${fileName}`;
        const newMaterial: Material = {
            id: Math.random().toString(36).substring(2, 9),
            title: fileName,
            url: pdfUrl,
            type: 'pdf',
            date: new Date().toISOString(),
            description: 'Posted a new material'
        };

        setTopics(prev => ({
            ...prev,
            [topicId]: {
                ...prev[topicId],
                materials: [newMaterial, ...(prev[topicId].materials || [])] // Prepend to show newest first
            }
        }));
    };

    if (!userRole) {
        return (
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="bg-background text-foreground">
                    <LoginView onLogin={(role) => setUserRole(role)} />
                    <Toaster position="top-right" />
                </div>
            </ThemeProvider>
        );
    }

    // Determine current title
    let navbarTitle = "C.O.T.E.ai";
    const selectedTopic = selectedTopicId ? topics[selectedTopicId] : null;
    if (selectedTopic) {
        navbarTitle = selectedTopic.title;
    } else if (activeTab !== 'dashboard') {
        navbarTitle = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="min-h-screen bg-background text-foreground flex">
                <Sidebar
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    userRole={userRole}
                    onLogout={() => {
                        setUserRole(null);
                        setSelectedTopicId(null);
                        setActiveTab('dashboard');
                    }}
                />

                <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                    <Navbar
                        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        title={navbarTitle}
                    />

                    <main className={`${selectedTopic ? 'h-[calc(100vh-64px)] overflow-hidden flex flex-col' : 'min-h-[calc(100vh-64px)]'}`}>
                        {selectedTopic ? (
                            <MaterialView
                                topic={selectedTopic}
                                onBack={handleBackToDashboard}
                                userRole={userRole}
                                onUploadComplete={handleUploadComplete}
                            />
                        ) : activeTab === 'progress' ? (
                            <StudentProgressView
                                onCreateClass={handleCreateClassroom}
                                topics={Object.values(topics)}
                                userRole={userRole}
                            />
                        ) : activeTab === 'assessments' ? (
                            <AssessmentPathView userRole={userRole} />
                        ) : (
                            <Dashboard
                                topics={Object.values(topics)}
                                onSelectTopic={handleSelectTopic}
                                userRole={userRole}
                                onJoinClass={handleJoinClassroom}
                                onUploadComplete={handleUploadComplete}
                                onNavigateToCreateClass={() => setActiveTab('progress')}
                            />
                        )}
                    </main>
                </div>

                <Chatbot sessionId={selectedTopicId} />
                <Toaster position="top-right" />
            </div>
        </ThemeProvider>
    );
}
