import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, AlertCircle, ArrowRight, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: number;
    sessionId: string;
    onComplete: () => void;
}

interface Question {
    id: number;
    question: string;
    options?: string[]; // MCQs
    correct_answer?: string; // MCQs
    type?: 'mcq' | 'short_answer';
}

interface Result {
    passed: boolean;
    xp_gained: number;
    new_total_xp: number;
    unlocked_level: number;
    score: number;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
    isOpen,
    onClose,
    level,
    sessionId,
    onComplete
}) => {
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [timer, setTimer] = useState(600); // 10 minutes
    const [result, setResult] = useState<Result | null>(null);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [wrongQuestions, setWrongQuestions] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && level && sessionId) {
            loadAssessment();
        } else {
            // Reset state on close
            setQuestions([]);
            setCurrentIndex(0);
            setUserAnswers({});
            setResult(null);
            setIsReviewMode(false);
            setTimer(600);
        }
    }, [isOpen, level, sessionId]);

    // Timer Logic
    useEffect(() => {
        if (!isOpen || result || loading) return;

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    submitAssessment(); // Auto-submit on timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, result, loading]);

    const loadAssessment = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/assessment/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, level })
            });
            const data = await res.json();

            if (data.questions) {
                setQuestions(data.questions);
            }
        } catch (error) {
            toast.error("Failed to load assessment.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerInitial = (answer: string) => {
        if (result || feedback) return; // Prevent multiple clicks

        const currentQ = questions[currentIndex];
        const isCorrect = answer === currentQ.correct_answer;

        setUserAnswers(prev => ({
            ...prev,
            [currentQ.id]: answer
        }));

        if (isCorrect) {
            setFeedback({ type: 'success', message: 'good work! +10 XP' });
        } else {
            setFeedback({ type: 'error', message: 'got it wrong, but its okay keep going!' });
            setWrongQuestions(prev => [...prev, {
                question: currentQ.question,
                correct_answer: currentQ.correct_answer,
                explanation: (currentQ as any).explanation,
                user_answer: answer
            }]);
        }

        // Auto-transition
        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                submitAssessment();
            }
        }, 2000);
    };

    const submitAssessment = async () => {
        setLoading(true);
        // Calculate basic score locally for display, strict validation happens backend
        let score = 0;
        questions.forEach(q => {
            if (q.correct_answer && userAnswers[q.id] === q.correct_answer) {
                score++;
            } else if (q.type === 'short_answer' && userAnswers[q.id]?.length > 5) {
                // Heuristic for open ended
                score++;
            }
        });

        try {
            const res = await fetch('http://localhost:8000/api/assessment/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    level,
                    score,
                    max_score: questions.length,
                    mistakes: wrongQuestions
                })
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            toast.error("Failed to submit assessment.");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card w-full max-w-3xl h-[80vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
            >
                {/* HEADER */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Level {level} Assessment</h2>
                        {!result && <p className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                        {!result && (
                            <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timer < 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                                <Clock size={20} />
                                {formatTime(timer)}
                            </div>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p>Loading your quest...</p>
                        </div>
                    ) : result && !isReviewMode ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`w-24 h-24 rounded-full flex items-center justify-center ${result.passed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                            >
                                {result.passed ? <Trophy size={48} /> : <AlertCircle size={48} />}
                            </motion.div>

                            <div>
                                <h3 className="text-3xl font-black mb-2">{result.passed ? 'Level Complete!' : 'Try Again'}</h3>
                                <div className="flex justify-center gap-8 my-6">
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-green-500">{result.score || (questions.length - wrongQuestions.length)}</div>
                                        <div className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Correct</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-red-500">{wrongQuestions.length}</div>
                                        <div className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Mistakes</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-yellow-500">+{result.xp_gained}</div>
                                        <div className="text-sm text-muted-foreground uppercase font-bold tracking-wider">XP</div>
                                    </div>
                                </div>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    {result.passed
                                        ? `You've earned ${result.xp_gained} XP and unlocked the next challenge!`
                                        : "Don't give up! Review your answers and try again to improve."}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsReviewMode(true)}
                                    className="px-6 py-3 rounded-xl border border-border hover:bg-accent flex items-center gap-2 font-semibold"
                                >
                                    <Eye size={18} /> Review Answers
                                </button>
                                <button
                                    onClick={onComplete}
                                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    ) : isReviewMode ? (
                        <div className="space-y-8">
                            {questions.map((q, idx) => {
                                const userAnswer = userAnswers[q.id];
                                const isCorrect = userAnswer === q.correct_answer;
                                return (
                                    <div key={q.id} className={`p-6 rounded-xl border ${isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                                        <div className="flex gap-3 mb-4">
                                            <span className="font-bold text-muted-foreground">#{idx + 1}</span>
                                            <h4 className="font-semibold text-lg">{q.question}</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                            {q.options?.map((opt) => (
                                                <div
                                                    key={opt}
                                                    className={`p-3 rounded-lg border text-sm font-medium
                                                        ${opt === q.correct_answer ? 'bg-green-500 text-white border-green-600' :
                                                            opt === userAnswer ? 'bg-red-500 text-white border-red-600' : 'bg-card border-border opacity-50'}
                                                    `}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="flex justify-center pt-8">
                                <button
                                    onClick={onComplete}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold"
                                >
                                    Back to Map
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto">
                            {questions.length > 0 && (
                                <AnimatePresence mode='wait'>
                                    <motion.div
                                        key={questions[currentIndex].id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8 relative"
                                    >
                                        <AnimatePresence>
                                            {feedback && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className={`absolute -top-12 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-bold text-white shadow-lg z-20 whitespace-nowrap ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                                                        }`}
                                                >
                                                    {feedback.message}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <h3 className="text-2xl font-bold leading-relaxed">
                                            {questions[currentIndex].question}
                                        </h3>

                                        <div className="space-y-3">
                                            {questions[currentIndex].options?.map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => handleAnswerInitial(option)}
                                                    disabled={!!feedback}
                                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-lg flex items-center justify-between
                                                        ${userAnswers[questions[currentIndex].id] === option
                                                            ? (feedback?.type === 'success' ? 'border-green-500 bg-green-500/10 text-green-500' :
                                                                feedback?.type === 'error' && userAnswers[questions[currentIndex].id] === option ? 'border-red-500 bg-red-500/10 text-red-500' :
                                                                    'border-primary bg-primary/10 text-primary')
                                                            : 'border-border hover:border-primary/50 hover:bg-accent'}`}
                                                >
                                                    {option}
                                                    {userAnswers[questions[currentIndex].id] === option && (
                                                        feedback?.type === 'success' ? <CheckCircle size={20} /> :
                                                            feedback?.type === 'error' ? <AlertCircle size={20} /> :
                                                                <CheckCircle size={20} />
                                                    )}
                                                </button>
                                            ))}

                                            {/* Short Answer Fallback */}
                                            {!questions[currentIndex].options && (
                                                <textarea
                                                    className="w-full p-4 rounded-xl border border-border bg-background min-h-[150px] focus:ring-2 focus:ring-primary outline-none"
                                                    placeholder="Type your answer here..."
                                                    value={userAnswers[questions[currentIndex].id] || ''}
                                                    onChange={(e) => handleAnswerInitial(e.target.value)}
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                {!result && !isReviewMode && !loading && (
                    <div className="p-6 border-t border-border flex items-center justify-between bg-muted/20">
                        <button
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="px-4 py-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                            Previous
                        </button>

                        {currentIndex === questions.length - 1 ? (
                            <button
                                onClick={submitAssessment}
                                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2"
                            >
                                Complete Quest <CheckCircle size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                disabled={!userAnswers[questions[currentIndex]?.id]}
                                className="px-6 py-3 bg-foreground text-background rounded-xl font-bold disabled:opacity-50 flex items-center gap-2"
                            >
                                Next Question <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Confetti or background particles could be added here */}
        </div>
    );
};

// Simple Trophy Icon Wrapper just in case
const Trophy = ({ size, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
);
