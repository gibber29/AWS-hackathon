import React, { useState } from 'react';
import { BookOpen, GraduationCap, ArrowLeft, Lock, User, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface LoginViewProps {
    onLogin: (role: 'teacher' | 'student', track: 'institution' | 'individual') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [step, setStep] = useState<'role' | 'credentials'>('role');
    const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [teacherMousePos, setTeacherMousePos] = useState({ x: 0, y: 0 });
    const [studentMousePos, setStudentMousePos] = useState({ x: 0, y: 0 });

    const handleRoleSelect = (role: 'teacher' | 'student', track: 'institution' | 'individual') => {
        setSelectedRole(role);
        setTrack(track);
        setStep('credentials');
    };

    const [track, setTrack] = useState<'institution' | 'individual'>('institution');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Dummy credential check
        setTimeout(() => {
            const normalizedUsername = username.toLowerCase().trim();
            const normalizedPassword = password.trim();

            const isValid = (selectedRole === 'teacher' && normalizedUsername === 'teacher' && normalizedPassword === 'password123') ||
                (selectedRole === 'student' && (normalizedUsername === 'student' || normalizedUsername === 'individual') && normalizedPassword === 'password123');

            if (isValid) {
                toast.success('Login successful!');
                onLogin(selectedRole!, track);
            } else {
                toast.error('Invalid credentials. Hint: use role name as username and "password123"');
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div
            className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden"
        >
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMousePos({
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top
                            });
                        }}
                        className="text-6xl font-black tracking-tighter mb-2 bg-clip-text text-transparent transition-all duration-75 cursor-default"
                        style={{
                            backgroundImage: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, #60a5fa 0%, #2563eb 40%, #1e3a8a 100%)`,
                            backgroundSize: '100% 100%',
                            filter: 'drop-shadow(0 0 20px rgba(37, 99, 235, 0.15))'
                        }}
                    >
                        C.O.T.E.ai
                    </h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">AI-Powered Classroom Ecosystem</p>
                </div>

                <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-2xl shadow-primary/10 backdrop-blur-xl animate-in zoom-in-95 duration-500">
                    {step === 'role' ? (
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black">Choose your path</h2>
                                <p className="text-sm text-muted-foreground">Select how you'll be using C.O.T.E.ai today.</p>
                            </div>

                            <div className="space-y-8 contents">
                                {/* Institution Section */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 ml-2">Institution Use</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onMouseMove={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setTeacherMousePos({
                                                    x: e.clientX - rect.left,
                                                    y: e.clientY - rect.top
                                                });
                                            }}
                                            onClick={() => handleRoleSelect('teacher', 'institution')}
                                            className="relative overflow-hidden flex items-center gap-6 p-5 bg-secondary/30 border-2 border-transparent hover:border-green-500 hover:shadow-[0_0_25px_rgba(34,197,94,0.1)] rounded-3xl transition-all group text-left"
                                        >
                                            <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                style={{
                                                    background: `radial-gradient(circle at ${teacherMousePos.x}px ${teacherMousePos.y}px, rgba(34,197,94,0.2) 0%, transparent 80%)`
                                                }}
                                            />
                                            <div className="relative z-10 w-12 h-12 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                                                <BookOpen size={24} />
                                            </div>
                                            <div className="relative z-10">
                                                <span className="block font-black text-lg group-hover:text-green-500 transition-colors leading-none mb-1">Teacher</span>
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Manage your classroom</span>
                                            </div>
                                        </button>

                                        <button
                                            onMouseMove={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setStudentMousePos({
                                                    x: e.clientX - rect.left,
                                                    y: e.clientY - rect.top
                                                });
                                            }}
                                            onClick={() => handleRoleSelect('student', 'institution')}
                                            className="relative overflow-hidden flex items-center gap-6 p-5 bg-secondary/30 border-2 border-transparent hover:border-blue-500 hover:shadow-[0_0_25px_rgba(59,130,246,0.1)] rounded-3xl transition-all group text-left"
                                        >
                                            <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                style={{
                                                    background: `radial-gradient(circle at ${studentMousePos.x}px ${studentMousePos.y}px, rgba(59,130,246,0.2) 0%, transparent 80%)`
                                                }}
                                            />
                                            <div className="relative z-10 w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                                <GraduationCap size={24} />
                                            </div>
                                            <div className="relative z-10">
                                                <span className="block font-black text-lg group-hover:text-blue-500 transition-colors leading-none mb-1">Student</span>
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Join your school class</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Personal Use Section */}
                                <div className="space-y-3 pt-4 border-t border-border/10">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/70 ml-2">Personal Use</h3>
                                    <button
                                        onMouseMove={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setStudentMousePos({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top
                                            });
                                        }}
                                        onClick={() => handleRoleSelect('student', 'individual')}
                                        className="w-full relative overflow-hidden flex items-center gap-6 p-5 bg-secondary/30 border-2 border-transparent hover:border-orange-500 hover:shadow-[0_0_25px_rgba(249,115,22,0.1)] rounded-3xl transition-all group text-left"
                                    >
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                            style={{
                                                background: `radial-gradient(circle at ${studentMousePos.x}px ${studentMousePos.y}px, rgba(249,115,22,0.2) 0%, transparent 80%)`
                                            }}
                                        />
                                        <div className="relative z-10 w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                                            <Zap size={24} />
                                        </div>
                                        <div className="relative z-10">
                                            <span className="block font-black text-lg group-hover:text-orange-500 transition-colors leading-none mb-1">Individual Learner</span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Solo learning path</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <header className="space-y-1">
                                <button
                                    onClick={() => setStep('role')}
                                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-4"
                                >
                                    <ArrowLeft size={14} /> Back to roles
                                </button>
                                <h2 className="text-2xl font-black capitalize">{selectedRole} Login</h2>
                                <p className="text-sm text-muted-foreground">Enter your credentials to continue to the portal.</p>
                            </header>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                        <input
                                            required
                                            type="text"
                                            placeholder={`e.g. ${selectedRole}`}
                                            className="w-full pl-12 pr-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                        <input
                                            required
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-5 py-4 bg-secondary/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl text-[10px] text-muted-foreground font-medium">
                                    <AlertCircle size={14} className="shrink-0" />
                                    <span>Hint: Username is "{selectedRole}" and password is "password123"</span>
                                </div>

                                <button
                                    disabled={isLoading}
                                    type="submit"
                                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Secure Login'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                <p className="text-center mt-8 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em]">
                    Enterprise Grade Security Powered by AI
                </p>
            </div>
        </div>
    );
};
