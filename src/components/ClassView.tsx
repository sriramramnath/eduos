import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { UploadButton } from "./UploadButton";
import { FileGrid } from "./FileGrid";
import { LinkGrid } from "./LinkGrid";
import { Gradebook } from "./Gradebook";
import { LearningPath } from "./LearningPath";
import { Scoreboard } from "./Scoreboard";
import { FileViewer } from "./FileViewer";
import { ArrowLeft, MessageSquare, FileText, Users, Map, Trophy, Mail, BookOpen, MoreVertical, Camera, Loader2, GraduationCap, CheckCircle2, X, Zap, Link as LinkIcon, Presentation, ExternalLink, ClipboardList } from "lucide-react";
import { Composer } from "./Composer";

interface ClassViewProps {
    classId: Id<"classes">;
    user: any;
    onBack: () => void;
}

export function ClassView({ classId, user, onBack }: ClassViewProps) {
    const [activeTab, setActiveTab] = useState<"stream" | "classwork" | "people" | "grades" | "path" | "leaderboard">("stream");
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const classData = useQuery(api.myFunctions.getClassById, { classId });

    if (!classData) return <div className="p-10 text-slate-400 font-bold animate-pulse text-center">Loading Class...</div>;

    return (
        <div className="animate-in fade-in duration-500 px-4 md:px-8 pt-6 flex flex-col items-center">
            {/* Centered Navigation & User Stats Bar */}
            <nav className="w-full max-w-6xl mx-auto mb-8">
                <div className="flex items-center justify-between gap-4 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center text-slate-400 shadow-sm group shrink-0"
                        title="Back to Hub"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    {/* Centered Navigation Tabs */}
                    <div className="relative p-1 bg-slate-100/70 border border-slate-200 rounded-xl items-center hidden md:flex flex-1 max-w-2xl justify-center">
                        {/* Sliding Highlight */}
                        <div
                            className="absolute h-[calc(100%-8px)] rounded-lg bg-emerald-600 transition-all duration-300 ease-out shadow-sm shadow-emerald-600/20"
                            style={{
                                width: 'calc(16.666% - 2px)',
                                transform: `translateX(${["stream", "classwork", "people", "grades", "path", "leaderboard"].indexOf(activeTab) * 100}%)`,
                                left: '1px'
                            }}
                        />
                        {(["stream", "classwork", "people", "grades", "path", "leaderboard"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative z-10 flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-300 ${activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                {tab === "stream" && <MessageSquare className="w-3 h-3" />}
                                {tab === "classwork" && <FileText className="w-3 h-3" />}
                                {tab === "people" && <Users className="w-3 h-3" />}
                                {tab === "grades" && <ClipboardList className="w-3 h-3" />}
                                {tab === "path" && <Map className="w-3 h-3" />}
                                {tab === "leaderboard" && <Trophy className="w-3 h-3" />}
                                <span className="hidden lg:inline">{tab}</span>
                            </button>
                        ))}
                    </div>

                    {/* Relocated User Info (XP & PFP) */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100/50 rounded-lg border border-emerald-200/50 shadow-sm">
                            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                            <span className="text-emerald-700 font-black text-xs tracking-tight">{user.xp || 0}</span>
                        </div>
                        <img
                            src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=ffffff&bold=true`}
                            className="w-9 h-9 rounded-xl border-2 border-white shadow-md ring-1 ring-slate-100 hidden sm:block"
                            alt={user.name}
                        />
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-6 left-6 right-6 h-14 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl flex items-center justify-around z-50 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <div className="absolute top-2 left-2 right-2 h-10 pointer-events-none">
                    <div
                        className="h-full rounded-xl bg-emerald-600 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-sm shadow-emerald-600/20"
                        style={{
                            width: '16.666%',
                            transform: `translateX(${["stream", "classwork", "people", "grades", "path", "leaderboard"].indexOf(activeTab as any) * 100}%)`,
                        }}
                    />
                </div>
                {(["stream", "classwork", "people", "grades", "path", "leaderboard"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative z-10 flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-colors duration-300 ${activeTab === tab ? "text-white" : "text-slate-400"}`}
                    >
                        {tab === "stream" && <MessageSquare className="w-5 h-5 transition-transform group-active:scale-95" />}
                        {tab === "classwork" && <FileText className="w-5 h-5 transition-transform group-active:scale-95" />}
                        {tab === "people" && <Users className="w-5 h-5 transition-transform group-active:scale-95" />}
                        {tab === "grades" && <ClipboardList className="w-5 h-5 transition-transform group-active:scale-95" />}
                        {tab === "path" && <Map className="w-5 h-5 transition-transform group-active:scale-95" />}
                        {tab === "leaderboard" && <Trophy className="w-5 h-5 transition-transform group-active:scale-95" />}
                        <span className="text-[7px] font-black uppercase tracking-tighter opacity-80">{tab}</span>
                    </button>
                ))}
            </div>

            <main className="w-full max-w-6xl mx-auto text-left pb-24 md:pb-16">
                {activeTab === "stream" && <StreamView classData={classData} user={user} onFileSelect={setSelectedFile} />}
                {activeTab === "classwork" && <ClassworkView classId={classId} user={user} />}
                {activeTab === "people" && <PeopleView classId={classId} />}
                {activeTab === "grades" && <Gradebook classId={classId} user={user} />}
                {activeTab === "path" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><LearningPath classId={classId} user={user} /></div>}
                {activeTab === "leaderboard" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><Scoreboard classId={classId} /></div>}
            </main>

            {selectedFile && (
                <FileViewer
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                />
            )}
        </div >
    );
}

function StreamView({ classData, user, onFileSelect }: { classData: any; user: any; onFileSelect: (file: any) => void }) {
    const entries = useQuery(api.myFunctions.getStreamEntries, { classId: classData._id }) || [];
    const bannerUrl = useQuery(api.myFunctions.getFileUrl, classData.bannerStorageId ? { storageId: classData.bannerStorageId } : "skip");
    const updateBanner = useMutation(api.myFunctions.updateClassBanner);
    const generateUploadUrl = useMutation(api.myFunctions.generateUploadUrl);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [activeQuiz, setActiveQuiz] = useState<any>(null);

    const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploadingBanner(true);
        try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();
            await updateBanner({ classId: classData._id, bannerStorageId: storageId });
        } catch (error) {
            console.error("Banner upload failed:", error);
        } finally {
            setIsUploadingBanner(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Banner */}
            <div className={`h-48 md:h-64 rounded-xl md:rounded-2xl p-6 md:p-10 flex flex-col justify-end text-white relative overflow-hidden shadow-2xl border border-slate-200/20 group ${!bannerUrl ? 'bg-slate-900' : ''}`}>
                {bannerUrl && (
                    <img src={bannerUrl} alt="Class Banner" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60" />
                )}
                {!bannerUrl && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900/50 to-slate-900 opacity-80"></div>
                        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent pointer-events-none"></div>
                        <div className="absolute top-4 right-8 opacity-5 transform -rotate-12 scale-[1.5] pointer-events-none text-white">
                            <BookOpen className="w-24 h-24" />
                        </div>
                    </>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>

                <div className="relative z-10 flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl font-bold tracking-tight drop-shadow-sm">{classData.name}</h2>
                            <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded border border-white/20 text-[10px] font-black tracking-widest">
                                {classData.code}
                            </div>
                        </div>
                        <p className="text-emerald-400 font-bold uppercase tracking-widest text-[9px]">{classData.description || "Academic Year 2026"}</p>
                    </div>

                    {user.role === "teacher" && (
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                id="banner-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleBannerUpload}
                                disabled={isUploadingBanner}
                            />
                            <label
                                htmlFor="banner-upload"
                                className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border border-white/20 ${isUploadingBanner ? 'opacity-50' : ''}`}
                            >
                                {isUploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                {isUploadingBanner ? "Wait..." : "Banner"}
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Feed */}
                <div className="md:col-span-4 space-y-6">
                    <Composer classId={classData._id} user={user} />

                    {entries.length === 0 ? (
                        <div className="text-center py-20 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
                            <div className="text-slate-300 mb-3 flex justify-center">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <p className="text-slate-400 font-medium text-sm italic">The stream is empty. Start the conversation!</p>
                        </div>
                    ) : (
                        entries.map((entry: any) => (
                            <div key={entry._id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {entry.entryType === "announcement" && (
                                    <div className="premium-card p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                                <MessageSquare className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                                    Post by {entry.authorEmail.split("@")[0]}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                                    {new Date(entry._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed pl-1 whitespace-pre-wrap">
                                            {entry.content}
                                        </p>
                                    </div>
                                )}

                                {entry.entryType === "quiz" && (
                                    <div className="premium-card overflow-hidden group">
                                        <div className="bg-emerald-600 p-4 flex items-center justify-between text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-md flex items-center justify-center">
                                                    <GraduationCap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Interactive Quiz</p>
                                                    <h4 className="text-sm font-bold tracking-tight">{entry.title}</h4>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Award</p>
                                                <p className="text-xs font-black">{entry.xpValue} XP</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-slate-400">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[11px] font-bold uppercase tracking-widest">{entry.questions.length} Questions</span>
                                            </div>
                                            <button
                                                onClick={() => setActiveQuiz(entry)}
                                                className="bg-slate-900 text-white px-6 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md shadow-slate-900/10"
                                            >
                                                Start Quiz
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {entry.entryType === "file" && (
                                    <div
                                        onClick={() => onFileSelect(entry)}
                                        className="premium-card p-4 flex items-start gap-4 group hover:border-emerald-500/30 transition-all cursor-pointer"
                                    >
                                        <div className="w-10 h-10 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                        {entry.uploadedBy.split("@")[0]} shared a resource
                                                    </p>
                                                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                                                        {entry.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                            {new Date(entry._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                        </p>
                                                        {entry.isAssignment && (
                                                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Assignment</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button className="w-8 h-8 rounded-md hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors">
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {entry.entryType === "link" && (
                                    <div
                                        onClick={() => window.open(entry.url, "_blank")}
                                        className="premium-card p-4 flex items-start gap-4 group hover:border-emerald-500/30 transition-all cursor-pointer"
                                    >
                                        <div className={`w-10 h-10 rounded-md flex items-center justify-center border transition-all ${entry.isWhiteboard ? "bg-violet-50 text-violet-600 border-violet-100 group-hover:bg-violet-600 group-hover:text-white" : "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white"}`}>
                                            {entry.isWhiteboard ? <Presentation className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                        {entry.createdBy.split("@")[0]} shared a {entry.isWhiteboard ? "whiteboard" : "link"}
                                                    </p>
                                                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                                                        {entry.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                            {new Date(entry._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                        </p>
                                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                                            Open <ExternalLink className="w-3 h-3" />
                                                        </span>
                                                    </div>
                                                </div>
                                                <button className="w-8 h-8 rounded-md hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors">
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {activeQuiz && (
                <QuizPlayer
                    quiz={activeQuiz}
                    onClose={() => setActiveQuiz(null)}
                    onComplete={(score: number) => {
                        console.log("Quiz completed with score:", score);
                        setActiveQuiz(null);
                    }}
                />
            )}
        </div>
    );
}

function QuizPlayer({ quiz, onClose, onComplete }: { quiz: any; onClose: () => void; onComplete: (score: number) => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [allowRetake, setAllowRetake] = useState(false);
    const [xpAwarded, setXpAwarded] = useState<number | null>(null);

    // Timer state
    const [timerActive, setTimerActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : 0);
    const [timerStarted, setTimerStarted] = useState(false);

    // XP calculation
    const xpPerCorrect = quiz.xpPerQuestion || 5;

    const completeQuizMutation = useMutation(api.myFunctions.completeQuiz);
    const hasSubmitted = useQuery(api.myFunctions.hasSubmittedQuiz, { quizId: quiz._id });

    // Timer effect
    useEffect(() => {
        if (!timerActive || timeRemaining <= 0 || !quiz.timeLimitMinutes) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timerActive, timeRemaining]);

    const handleAutoSubmit = async () => {
        setIsFinished(true);
        try {
            const result = await completeQuizMutation({
                quizId: quiz._id,
                score,
                totalQuestions: quiz.questions.length
            });
            setXpAwarded(result?.xpAwarded ?? 0);
        } catch (err) {
            console.error("Auto-submit failed:", err);
        }
    };

    const handleNext = async () => {
        const isLastQuestion = currentStep === quiz.questions.length - 1;
        const newScore = selectedOption === quiz.questions[currentStep].correctOption ? score + 1 : score;

        if (selectedOption === quiz.questions[currentStep].correctOption) {
            setScore(newScore);
        }

        if (!isLastQuestion) {
            setCurrentStep(currentStep + 1);
            setSelectedOption(null);
        } else {
            setIsFinished(true);
            setTimerActive(false);
            try {
                const result = await completeQuizMutation({
                    quizId: quiz._id,
                    score: newScore,
                    totalQuestions: quiz.questions.length
                });
                setXpAwarded(result?.xpAwarded ?? 0);
            } catch (err) {
                console.error("Failed to submit quiz:", err);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Loading state for submission check
    if (quiz.singleAttempt && hasSubmitted === undefined) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-in zoom-in-95">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Already completed: allow a retake but no XP awarded
    if (hasSubmitted && !isFinished && !allowRetake) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto text-4xl shadow-inner">🎉</div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">You've done it already!</h3>
                        <p className="text-slate-500 font-medium text-base leading-relaxed">
                            You've already completed this quiz. You can retake it, but no XP will be awarded.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                            Close
                        </button>
                        <button onClick={() => setAllowRetake(true)} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg">
                            Retake (No XP)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Timer start screen (if timed quiz)
    if (quiz.timeLimitMinutes && !timerStarted) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto text-2xl">⏱️</div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{quiz.title}</h3>
                        <p className="text-slate-500 font-medium text-sm">This is a timed quiz. You have <strong>{quiz.timeLimitMinutes} minutes</strong> to complete {quiz.questions.length} questions.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                            Cancel
                        </button>
                        <button onClick={() => { setTimerStarted(true); setTimerActive(true); }} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all">
                            Start Timer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {!isFinished ? (
                    <>
                        <div className="bg-emerald-600 p-6 flex items-center justify-between text-white">
                            <div>
                                <h3 className="font-bold tracking-tight">{quiz.title}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Question {currentStep + 1} of {quiz.questions.length}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {quiz.timeLimitMinutes && (
                                    <div className={`px-3 py-1 rounded-full bg-white/20 text-[11px] font-black tracking-wider ${timeRemaining < 60 ? "animate-pulse text-rose-200" : ""}`}>
                                        {formatTime(timeRemaining)}
                                    </div>
                                )}
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            {hasSubmitted && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                                    Retake mode: no XP awarded.
                                </div>
                            )}
                            <h4 className="text-lg font-bold text-slate-900 leading-tight">
                                {quiz.questions[currentStep].question}
                            </h4>
                            <div className="space-y-3">
                                {quiz.questions[currentStep].options.map((option: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedOption(i)}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all font-bold text-sm ${selectedOption === i
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                                            : "border-slate-100 hover:border-slate-200 text-slate-600"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${selectedOption === i ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 text-slate-300"}`}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            {option}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleNext}
                                disabled={selectedOption === null}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10"
                            >
                                {currentStep === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto text-3xl">
                            🏆
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Well Done!</h3>
                            <p className="text-slate-500 font-medium">You scored {score} out of {quiz.questions.length}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 inline-block px-8">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">XP Earned</p>
                            <p className="text-2xl font-black text-emerald-700">+{xpAwarded ?? score * xpPerCorrect}</p>
                        </div>
                        <button
                            onClick={() => onComplete(score)}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
                        >
                            Return to Stream
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ClassworkView({ classId, user }: { classId: Id<"classes">; user: any }) {
    const files = useQuery(api.myFunctions.getClassFiles, { classId }) || [];
    const links = useQuery(api.myFunctions.getClassLinks, { classId }) || [];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Resources</h2>
                    <p className="text-sm text-slate-500 font-medium">Shared documents and materials.</p>
                </div>
                {user.role === "teacher" && (
                    <UploadButton classId={classId} isAssignment={true} />
                )}
            </div>

            {files.length > 0 && (
                <FileGrid files={files} userRole={user.role} />
            )}

            {links.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Links</h3>
                            <p className="text-sm text-slate-500 font-medium">Shared links and whiteboards.</p>
                        </div>
                    </div>
                    <LinkGrid links={links} />
                </div>
            )}

            {files.length === 0 && links.length === 0 && (
                <div className="text-center py-16 rounded-md bg-slate-50 border border-dashed border-slate-200">
                    <div className="flex justify-center mb-4 text-emerald-200">
                        <FileText className="w-10 h-10" />
                    </div>
                    <p className="text-slate-400 font-bold italic text-sm">No resources shared yet in this workspace.</p>
                    {user.role !== "student" && (
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-2">Upload resources or attach a link to get started</p>
                    )}
                </div>
            )}
        </div>
    );
}

function PeopleView({ classId }: { classId: Id<"classes"> }) {
    const members = useQuery(api.myFunctions.getClassMembers, { classId }) || [];
    const teacher = useQuery(api.myFunctions.getClassTeacher, { classId });

    return (
        <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pb-20">
            <div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6 text-left">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Teachers</h2>
                </div>
                {teacher ? (
                    <div className="flex items-center gap-4 p-4 premium-card border-slate-200">
                        <img
                            src={teacher.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=10b981&color=ffffff&bold=true`}
                            className="w-12 h-12 rounded-md border border-slate-200 shadow-sm"
                            alt={teacher.name}
                        />
                        <div>
                            <p className="text-base font-bold text-slate-900">{teacher.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Class Administrator</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 premium-card border-slate-100 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                    </div>
                )}
            </div>

            <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Students</h2>
                    <span className="px-3 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-widest">{members.length} Active</span>
                </div>

                <div className="space-y-2">
                    {members.map((member: any) => (
                        <div key={member.email} className="premium-card p-4 flex items-center gap-4 group hover:border-emerald-500/30 transition-all cursor-pointer">
                            <img
                                src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=10b981&color=ffffff&bold=true`}
                                className="w-10 h-10 rounded-md border border-slate-200 shadow-sm"
                                alt={member.name}
                            />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">{member.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.email}</p>
                            </div>
                            <button className="w-9 h-9 rounded-md bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center">
                                <Mail className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <div className="text-center py-16 rounded-md bg-slate-50/50 border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold text-xs italic">No students joined yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
