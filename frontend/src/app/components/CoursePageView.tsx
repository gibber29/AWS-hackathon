import React from 'react';
import {
    Calendar,
    ChevronRight,
    CheckCircle2,
    Circle,
    ArrowLeft,
    PlayCircle,
    FileText
} from 'lucide-react';

interface Day {
    day_number: number;
    topic: string;
    learning_objectives: string[];
    youtube_search_term: string;
    reference_content: string;
}

interface Week {
    week_number: number;
    goal: string;
    days: Day[];
}

interface Roadmap {
    id: string;
    title: string;
    description: string;
    weeks: Week[];
    days_completed: number;
    total_days: number;
}

interface CoursePageViewProps {
    roadmap: Roadmap;
    onBack: () => void;
    onSelectDay: (day: Day) => void;
    completedDays: number[];
}

export const CoursePageView: React.FC<CoursePageViewProps> = ({
    roadmap,
    onBack,
    onSelectDay,
    completedDays
}) => {
    const [view, setView] = React.useState<'overview' | 'today'>('overview');

    const getCurrentDay = () => {
        const nextDayNum = (completedDays.length > 0 ? Math.max(...completedDays) : 0) + 1;
        for (const week of roadmap.weeks) {
            for (const day of week.days) {
                if (day.day_number === nextDayNum) return day;
            }
        }
        return roadmap.weeks[0].days[0]; // Fallback to day 1
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-widest text-xs"
            >
                <ArrowLeft size={16} /> Back to Studio
            </button>

            <header className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-black tracking-tight">{roadmap.title}</h1>
                    <div className="flex bg-accent rounded-xl p-1">
                        <button
                            onClick={() => setView('overview')}
                            className={`px - 4 py - 2 rounded - lg text - sm font - black transition - all ${view === 'overview' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'} `}
                        >
                            OVERVIEW
                        </button>
                        <button
                            onClick={() => setView('today')}
                            className={`px - 4 py - 2 rounded - lg text - sm font - black transition - all ${view === 'today' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'} `}
                        >
                            GO TO TODAY
                        </button>
                    </div>
                </div>
                <p className="text-xl text-muted-foreground font-medium max-w-3xl">
                    {roadmap.description}
                </p>
                <div className="flex items-center gap-6 pt-2">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overall Progress</p>
                        <div className="flex items-center gap-3">
                            <div className="w-48 h-2 bg-accent rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-1000"
                                    style={{ width: `${(completedDays.length / roadmap.total_days) * 100}% ` }}
                                />
                            </div>
                            <span className="font-black text-primary">{Math.round((completedDays.length / roadmap.total_days) * 100)}%</span>
                        </div>
                    </div>
                    <div className="px-6 border-l border-border space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Days Completed</p>
                        <p className="font-black text-2xl">{completedDays.length} / {roadmap.total_days}</p>
                    </div>
                </div>
            </header>

            {view === 'overview' ? (
                <div className="space-y-12">
                    {roadmap.weeks.map((week) => (
                        <section key={week.week_number} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center font-black text-xl">
                                    W{week.week_number}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Week {week.week_number}</h2>
                                    <p className="text-muted-foreground font-medium">{week.goal}</p>
                                </div>
                            </div>

                            <div className="grid gap-4 ml-6 pl-6 border-l-2 border-primary/10">
                                {week.days.map((day) => {
                                    const isCompleted = completedDays.includes(day.day_number);
                                    const isNext = day.day_number === (completedDays.length > 0 ? Math.max(...completedDays) + 1 : 1);

                                    return (
                                        <button
                                            key={day.day_number}
                                            onClick={() => onSelectDay(day)}
                                            className={`flex items - center justify - between p - 6 rounded - 3xl border - 2 transition - all text - left group ${isCompleted
                                                    ? 'bg-accent/30 border-transparent opacity-80'
                                                    : isNext
                                                        ? 'bg-primary/5 border-primary/20 hover:border-primary shadow-xl shadow-primary/5'
                                                        : 'bg-card border-border hover:border-primary/50'
                                                } `}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`w - 10 h - 10 rounded - xl flex items - center justify - center transition - colors ${isCompleted ? 'bg-green-500/20 text-green-500' : 'bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                                    } `}>
                                                    {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Day {day.day_number}</p>
                                                    <h3 className={`font - bold text - lg ${isNext ? 'text-primary' : ''} `}>{day.topic}</h3>
                                                </div>
                                            </div>
                                            <ChevronRight className={`text - muted - foreground group - hover: text - primary group - hover: translate - x - 1 transition - all ${isNext ? 'text-primary' : ''} `} />
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-12 text-center space-y-8">
                    <div className="max-w-xl mx-auto space-y-4">
                        <h2 className="text-3xl font-black">Ready for Day {getCurrentDay().day_number}?</h2>
                        <p className="text-muted-foreground text-lg font-medium">"{getCurrentDay().topic}"</p>
                    </div>
                    <div className="flex justify-center gap-6">
                        <div className="p-6 bg-background rounded-3xl border border-border flex flex-col items-center gap-3 w-48 transition-all hover:scale-[1.05] hover:border-primary group">
                            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <FileText size={24} />
                            </div>
                            <span className="font-bold">Materials</span>
                        </div>
                        <div className="p-6 bg-background rounded-3xl border border-border flex flex-col items-center gap-3 w-48 transition-all hover:scale-[1.05] hover:border-primary group">
                            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                                <PlayCircle size={24} />
                            </div>
                            <span className="font-bold">Videos</span>
                        </div>
                        <div className="p-6 bg-background rounded-3xl border border-border flex flex-col items-center gap-3 w-48 transition-all hover:scale-[1.05] hover:border-primary group">
                            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all">
                                <Calendar size={24} />
                            </div>
                            <span className="font-bold">Assessment</span>
                        </div>
                    </div>
                    <button
                        onClick={() => onSelectDay(getCurrentDay())}
                        className="px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30"
                    >
                        Dive In
                    </button>
                </div>
            )}
        </div>
    );
};
