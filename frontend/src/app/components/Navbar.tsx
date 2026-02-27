import React, { useEffect, useState } from 'react';
import {
    Plus,
    Grid,
    Bell,
    UserCircle,
    Sun,
    Moon,
    Zap
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface NavbarProps {
    onMenuClick: () => void;
    title?: string;
    userRole: 'teacher' | 'student' | null;
    onJoinClassClick?: () => void;
    onClassroomsClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
    onMenuClick,
    title = "C.O.T.E.ai",
    userRole,
    onJoinClassClick,
    onClassroomsClick
}) => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="h-16 bg-card border-b border-border sticky top-0 z-30 px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-accent rounded-full transition-colors lg:hidden"
                >
                    <UserCircle size={20} className="text-foreground/70" />
                </button>
                <h1 className="text-lg font-medium text-foreground">{title}</h1>
            </div>

            <div className="flex items-center gap-2">
                {userRole === 'student' && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-full mr-2">
                        <Zap size={16} fill="currentColor" />
                        <span className="text-sm font-black">840 XP</span>
                    </div>
                )}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 hover:bg-accent rounded-full transition-colors text-foreground/70"
                    aria-label="Toggle theme"
                >
                    {mounted && (theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />)}
                </button>
                <button
                    onClick={onJoinClassClick}
                    className="p-2 hover:bg-accent rounded-full transition-colors text-foreground/70"
                >
                    <Plus size={22} />
                </button>
                <button
                    onClick={onClassroomsClick}
                    className="p-2 hover:bg-accent rounded-full transition-colors text-foreground/70"
                >
                    <Grid size={20} />
                </button>
                <button className="p-2 hover:bg-accent rounded-full transition-colors text-foreground/70 relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
                </button>
                <div className={`ml-2 w-8 h-8 rounded-full ${userRole === 'teacher' ? 'bg-green-600' : (title?.includes('Individual') || title?.includes('Personal') ? 'bg-orange-600' : 'bg-blue-600')} flex items-center justify-center text-white font-semibold cursor-pointer`}>
                    {userRole === 'teacher' ? 'T' : (title?.includes('Individual') || title?.includes('Personal') ? 'U1' : 'S')}
                </div>
            </div>
        </header>
    );
};
