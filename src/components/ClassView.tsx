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
import { ArrowLeft, MessageSquare, FileText, Users, Map, Trophy, Mail, BookOpen, MoreVertical, Camera, Loader2, GraduationCap, CheckCircle2, X, Zap, Link as LinkIcon, Presentation, ExternalLink, ClipboardList, Plus, Crown, User } from "lucide-react";
import { Composer } from "./Composer";

interface ClassViewProps {
    classId: Id<"classes">;
    user: any;
    onBack: () => void;
    onOpenSettings: () => void;
}

export function ClassView({ classId, user, onBack, onOpenSettings }: ClassViewProps) {
    const [activeTab, setActiveTab] = useState<"stream" | "classwork" | "people" | "grades" | "path" | "leaderboard">("stream");
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const classData = useQuery(api.myFunctions.getClassById, { classId });

    if (!classData) return <div className="p-10 text-slate-400 font-bold animate-pulse text-center">Loading Class...</div>;

    const tabs = (user.role === "teacher"
        ? ["stream", "classwork", "people", "grades", "path", "leaderboard"]
        : ["stream", "classwork", "people", "path", "leaderboard"]) as const;

    return (
        <div className="animate-in fade-in duration-500 px-3 sm:px-4 md:px-8 pt-6 flex flex-col items-center">
            {/* Centered Navigation & User Stats Bar */}
            <nav className="w-full max-w-6xl mx-auto mb-8 hidden md:block">
                <div className="flex items-center justify-between gap-4 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl px-4 py-3 shadow-sm relative z-20">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center text-slate-400 shadow-sm group shrink-0"
                        title="Back to Hub"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    {/* Centered Navigation Tabs */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 p-1 bg-slate-100/70 border border-slate-200 rounded-xl items-center hidden md:grid w-full max-w-2xl"
                        style={{
                            ["--tab-index" as any]: tabs.indexOf(activeTab as any),
                            gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                        }}
                    >
                        {/* Sliding Highlight */}
                        <div className="absolute inset-1 pointer-events-none">
                            <div
                                className="h-full rounded-lg bg-emerald-600 transition-all duration-300 ease-out shadow-sm shadow-emerald-600/20"
                                style={{
                                    width: `calc(100% / ${tabs.length})`,
                                    transform: "translateX(calc(var(--tab-index) * 100%))",
                                }}
                            />
                        </div>
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative z-10 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-300 ${activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                {tab === "stream" && <MessageSquare className="w-3 h-3" />}
                                {tab === "classwork" && <FileText className="w-3 h-3" />}
                                {tab === "people" && <Users className="w-3 h-3" />}
                                {tab === "grades" && (
                                    <>
                                        <ClipboardList className="w-3 h-3" />
                                        <Crown className="w-3 h-3 text-amber-400" />
                                    </>
                                )}
                                {tab === "path" && <Map className="w-3 h-3" />}
                                {tab === "leaderboard" && <Trophy className="w-3 h-3" />}
                                <span className="hidden lg:inline">{tab === "grades" ? "analytics" : tab}</span>
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
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 border-white shadow-md ring-1 ring-slate-100 hidden sm:block"
                            alt={user.name}
                        />
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-3 right-3 sm:left-6 sm:right-6 h-14 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl flex items-center z-50 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <div className="relative flex-1 h-full">
                    <div className="absolute top-2 left-2 right-2 h-10 pointer-events-none">
                        <div
                            className="h-full rounded-xl bg-emerald-600 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-sm shadow-emerald-600/20"
                            style={{
                                width: `${100 / tabs.length}%`,
                                transform: `translateX(${tabs.indexOf(activeTab as any) * 100}%)`,
                            }}
                        />
                    </div>
                    <div className="relative z-10 h-full flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative z-10 flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-colors duration-300 ${activeTab === tab ? "text-white" : "text-slate-400"}`}
                            >
                                {tab === "stream" && <MessageSquare className="w-5 h-5 transition-transform group-active:scale-95" />}
                                {tab === "classwork" && <FileText className="w-5 h-5 transition-transform group-active:scale-95" />}
                                {tab === "people" && <Users className="w-5 h-5 transition-transform group-active:scale-95" />}
                                {tab === "grades" && (
                                    <div className="flex items-center gap-1">
                                        <ClipboardList className="w-5 h-5 transition-transform group-active:scale-95" />
                                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                                    </div>
                                )}
                                {tab === "path" && <Map className="w-5 h-5 transition-transform group-active:scale-95" />}
                                {tab === "leaderboard" && <Trophy className="w-5 h-5 transition-transform group-active:scale-95" />}
                                <span className="text-[7px] font-black uppercase tracking-tighter opacity-80">{tab === "grades" ? "analytics" : tab}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={onOpenSettings}
                    className="mx-2 w-10 h-10 rounded-xl border border-slate-200 bg-white/90 shadow-sm flex items-center justify-center"
                    title="Settings"
                >
                    <User className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            <main className="w-full max-w-6xl mx-auto text-left pb-24 md:pb-16">
                {activeTab === "stream" && <StreamView classData={classData} user={user} onFileSelect={setSelectedFile} />}
                {activeTab === "classwork" && <ClassworkView classId={classId} user={user} />}
                {activeTab === "people" && <PeopleView classId={classId} user={user} />}
                {activeTab === "grades" && <Gradebook classId={classId} user={user} />}
                {activeTab === "path" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><LearningPath classId={classId} user={user} /></div>}
                {activeTab === "leaderboard" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><Scoreboard classId={classId} /></div>}
            </main>

            {selectedFile && (
                <FileViewer
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                    userRole={user.role}
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
    const createReflection = useMutation(api.myFunctions.createReflection);
    const reflections = useQuery(api.myFunctions.getStudentReflections, { classId: classData._id, studentId: user.email }) || [];
    const latestReflection = [...reflections].sort((a, b) => b.createdAt - a.createdAt)[0];
    const forms = useQuery(api.myFunctions.getForms, { classId: classData._id }) || [];
    const activeForms = forms.filter((form: any) => form.isOpen);
    const submitForm = useMutation(api.myFunctions.submitForm);
    const setFormActive = useMutation(api.myFunctions.setFormActive);
    const [activeForm, setActiveForm] = useState<any | null>(null);
    const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
    const [mood, setMood] = useState("Focused");
    const [goal, setGoal] = useState("");
    const [blocker, setBlocker] = useState("");
    const [submittingReflection, setSubmittingReflection] = useState(false);


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
            <div className={`h-48 md:h-60 lg:h-[18rem] w-screen relative left-1/2 right-1/2 -mx-[50vw] -mt-32 md:-mt-36 lg:-mt-40 p-6 md:p-10 flex flex-col justify-end text-white overflow-hidden shadow-2xl border-y border-slate-200/20 group z-0 ${!bannerUrl ? 'bg-slate-900' : ''}`}>
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

                    {user.role === "student" && (
                        <div className="premium-card p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Daily Check-In</p>
                                    <p className="text-sm font-bold text-slate-900">How are you doing today?</p>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {latestReflection ? `Last: ${new Date(latestReflection.createdAt).toLocaleDateString()}` : "New"}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <select
                                    value={mood}
                                    onChange={(e) => setMood(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-700"
                                >
                                    <option>Focused</option>
                                    <option>Motivated</option>
                                    <option>Stuck</option>
                                    <option>Overwhelmed</option>
                                    <option>Curious</option>
                                </select>
                                <input
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    placeholder="Today's goal"
                                    className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-700"
                                />
                                <input
                                    value={blocker}
                                    onChange={(e) => setBlocker(e.target.value)}
                                    placeholder="Any blockers?"
                                    className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-700"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Private to your teacher</p>
                                <button
                                    disabled={submittingReflection}
                                    onClick={async () => {
                                        setSubmittingReflection(true);
                                        await createReflection({ classId: classData._id, mood, goal, blocker });
                                        setGoal("");
                                        setBlocker("");
                                        setSubmittingReflection(false);
                                    }}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                                >
                                    {submittingReflection ? "Saving..." : "Submit Check-In"}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeForms.length > 0 && (
                        <div className="premium-card p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Forms</p>
                                    <p className="text-sm font-bold text-slate-900">Surveys and permissions</p>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {activeForms.length} active
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {activeForms.map((form: any) => (
                                    <div key={form._id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{form.category.replace("_", " ")}</p>
                                        <p className="text-sm font-bold text-slate-900">{form.title}</p>
                                        <p className="text-xs text-slate-500">{form.description || "No description"}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{form.questions.length} questions</span>
                                            <div className="flex items-center gap-2">
                                                {user.role === "student" && (
                                                    <button
                                                        onClick={() => {
                                                            setActiveForm(form);
                                                            setFormAnswers({});
                                                        }}
                                                        className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                                    >
                                                        Fill
                                                    </button>
                                                )}
                                                {user.role === "teacher" && (
                                                    <button
                                                        onClick={() => setFormActive({ formId: form._id, isOpen: false })}
                                                        className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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

            {activeForm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-md p-8 max-w-2xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{activeForm.title}</h3>
                            <p className="text-slate-500 font-medium text-xs">{activeForm.description || ""}</p>
                        </div>
                        <div className="space-y-4">
                            {activeForm.questions.map((q: any) => (
                                <div key={q.id} className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{q.label}</label>
                                    {q.type === "short" && (
                                        <input
                                            value={formAnswers[q.id] || ""}
                                            onChange={(e) => setFormAnswers({ ...formAnswers, [q.id]: e.target.value })}
                                            className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
                                        />
                                    )}
                                    {q.type === "long" && (
                                        <textarea
                                            value={formAnswers[q.id] || ""}
                                            onChange={(e) => setFormAnswers({ ...formAnswers, [q.id]: e.target.value })}
                                            className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 h-24 resize-none"
                                        />
                                    )}
                                    {q.type === "single" && (
                                        <div className="flex flex-wrap gap-2">
                                            {(q.options || []).map((opt: string) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setFormAnswers({ ...formAnswers, [q.id]: opt })}
                                                    className={`px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${formAnswers[q.id] === opt ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-500"}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {q.type === "multi" && (
                                        <div className="flex flex-wrap gap-2">
                                            {(q.options || []).map((opt: string) => {
                                                const current = (formAnswers[q.id] || "").split("|").filter(Boolean);
                                                const isSelected = current.includes(opt);
                                                return (
                                                    <button
                                                        key={opt}
                                                        onClick={() => {
                                                            const next = isSelected ? current.filter((c) => c !== opt) : [...current, opt];
                                                            setFormAnswers({ ...formAnswers, [q.id]: next.join("|") });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${isSelected ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-500"}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveForm(null)}
                                className="flex-1 py-2.5 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await submitForm({
                                        formId: activeForm._id,
                                        classId: classData._id,
                                        answers: Object.entries(formAnswers).map(([questionId, value]) => ({ questionId, value })),
                                    });
                                    setActiveForm(null);
                                }}
                                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-widest"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
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
    const outcomes = useQuery(api.myFunctions.getOutcomes, { classId }) || [];
    const forms = useQuery(api.myFunctions.getForms, { classId }) || [];
    const createOutcome = useMutation(api.myFunctions.createOutcome);
    const createForm = useMutation(api.myFunctions.createForm);
    const submitForm = useMutation(api.myFunctions.submitForm);

    const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
    const [outcomeCode, setOutcomeCode] = useState("");
    const [outcomeTitle, setOutcomeTitle] = useState("");
    const [outcomeDesc, setOutcomeDesc] = useState("");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formCategory, setFormCategory] = useState<"survey" | "permission" | "field_trip">("survey");
    const [formQuestions, setFormQuestions] = useState<any[]>([]);
    const [activeForm, setActiveForm] = useState<any | null>(null);
    const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
    const [responsesFormId, setResponsesFormId] = useState<Id<"forms"> | null>(null);
    const responses = useQuery(api.myFunctions.getFormResponses, responsesFormId ? { formId: responsesFormId } : "skip") || [];
    const newQuestionId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    const responsesForm = forms.find((f: any) => f._id === responsesFormId);
    const getQuestionLabel = (questionId: string) => {
        const found = responsesForm?.questions?.find((q: any) => q.id === questionId);
        return found?.label || questionId;
    };

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

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Outcomes</h3>
                        <p className="text-sm text-slate-500 font-medium">Standards mapped to assignments.</p>
                    </div>
                    {user.role === "teacher" && (
                        <button
                            onClick={() => setIsOutcomeOpen(true)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-emerald-600 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Outcome
                        </button>
                    )}
                </div>
                {outcomes.length === 0 ? (
                    <div className="text-center py-10 rounded-md bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                        No outcomes defined yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {outcomes.map((o: any) => (
                            <div key={o._id} className="premium-card p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{o.code}</p>
                                <p className="text-sm font-bold text-slate-900">{o.title}</p>
                                {o.description && <p className="text-xs text-slate-500 mt-1">{o.description}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Forms</h3>
                        <p className="text-sm text-slate-500 font-medium">Surveys, permissions, and field trip slips.</p>
                    </div>
                    {user.role === "teacher" && (
                        <button
                            onClick={() => {
                                setFormQuestions([{ id: newQuestionId(), label: "Question", type: "short" }]);
                                setIsFormOpen(true);
                            }}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all"
                        >
                            <Plus className="w-4 h-4" /> New Form
                        </button>
                    )}
                </div>

                {forms.length === 0 ? (
                    <div className="text-center py-10 rounded-md bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                        No forms created yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {forms.map((form: any) => (
                            <div key={form._id} className="premium-card p-4 space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{form.category.replace("_", " ")}</p>
                                <p className="text-sm font-bold text-slate-900">{form.title}</p>
                                <p className="text-xs text-slate-500">{form.description || "No description"}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{form.questions.length} questions</span>
                                    {user.role === "student" ? (
                                        <button
                                            onClick={() => {
                                                setActiveForm(form);
                                                setFormAnswers({});
                                            }}
                                            className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                        >
                                            Fill
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setResponsesFormId(form._id)}
                                            className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                        >
                                            Responses
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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

            {isOutcomeOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-md p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight text-center">New Outcome</h3>
                        <input
                            className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700 text-sm"
                            placeholder="Code (e.g., ELA.1)"
                            value={outcomeCode}
                            onChange={(e) => setOutcomeCode(e.target.value)}
                        />
                        <input
                            className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700 text-sm"
                            placeholder="Title"
                            value={outcomeTitle}
                            onChange={(e) => setOutcomeTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-600 text-sm h-24 resize-none"
                            placeholder="Description (optional)"
                            value={outcomeDesc}
                            onChange={(e) => setOutcomeDesc(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsOutcomeOpen(false)}
                                className="flex-1 py-2.5 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!outcomeCode || !outcomeTitle) return;
                                    await createOutcome({ classId, code: outcomeCode, title: outcomeTitle, description: outcomeDesc });
                                    setOutcomeCode("");
                                    setOutcomeTitle("");
                                    setOutcomeDesc("");
                                    setIsOutcomeOpen(false);
                                }}
                                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-widest"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-md p-8 max-w-2xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight text-center">New Form</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700 text-sm"
                                placeholder="Form title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                            />
                            <select
                                value={formCategory}
                                onChange={(e) => setFormCategory(e.target.value as any)}
                                className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700 text-sm"
                            >
                                <option value="survey">Survey</option>
                                <option value="permission">Permission Slip</option>
                                <option value="field_trip">Field Trip</option>
                            </select>
                        </div>
                        <textarea
                            className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-600 text-sm h-20 resize-none"
                            placeholder="Description (optional)"
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                        />
                        <div className="space-y-3">
                            {formQuestions.map((q, idx) => (
                                <div key={q.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                                    <input
                                        value={q.label}
                                        onChange={(e) => {
                                            const next = [...formQuestions];
                                            next[idx] = { ...next[idx], label: e.target.value };
                                            setFormQuestions(next);
                                        }}
                                        className="md:col-span-3 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
                                        placeholder="Question label"
                                    />
                                    <select
                                        value={q.type}
                                        onChange={(e) => {
                                            const next = [...formQuestions];
                                            next[idx] = { ...next[idx], type: e.target.value };
                                            setFormQuestions(next);
                                        }}
                                        className="md:col-span-2 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
                                    >
                                        <option value="short">Short Text</option>
                                        <option value="long">Long Text</option>
                                        <option value="single">Single Choice</option>
                                        <option value="multi">Multi Choice</option>
                                    </select>
                                    <button
                                        onClick={() => setFormQuestions(formQuestions.filter((_, i) => i !== idx))}
                                        className="md:col-span-1 px-3 py-2 rounded-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50"
                                    >
                                        Remove
                                    </button>
                                    {["single", "multi"].includes(q.type) && (
                                        <input
                                            value={q.options || ""}
                                            onChange={(e) => {
                                                const next = [...formQuestions];
                                                next[idx] = { ...next[idx], options: e.target.value };
                                                setFormQuestions(next);
                                            }}
                                            className="md:col-span-6 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
                                            placeholder="Options (comma separated)"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setFormQuestions([...formQuestions, { id: newQuestionId(), label: "Question", type: "short" }])}
                                className="px-3 py-2 rounded-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                            >
                                Add Question
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!formTitle || formQuestions.length === 0) return;
                                        const payload = formQuestions.map((q) => ({
                                            id: q.id,
                                            label: q.label,
                                            type: q.type,
                                            options: q.options ? q.options.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
                                        }));
                                        await createForm({ classId, title: formTitle, description: formDesc, category: formCategory, questions: payload });
                                        setFormTitle("");
                                        setFormDesc("");
                                        setFormQuestions([]);
                                        setIsFormOpen(false);
                                    }}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                                >
                                    Publish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeForm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-md p-8 max-w-2xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{activeForm.title}</h3>
                            <p className="text-slate-500 font-medium text-xs">{activeForm.description || ""}</p>
                        </div>
                        <div className="space-y-4">
                            {activeForm.questions.map((q: any) => (
                                <div key={q.id} className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{q.label}</label>
                                    {q.type === "short" && (
                                        <input
                                            value={formAnswers[q.id] || ""}
                                            onChange={(e) => setFormAnswers({ ...formAnswers, [q.id]: e.target.value })}
                                            className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
                                        />
                                    )}
                                    {q.type === "long" && (
                                        <textarea
                                            value={formAnswers[q.id] || ""}
                                            onChange={(e) => setFormAnswers({ ...formAnswers, [q.id]: e.target.value })}
                                            className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 h-24 resize-none"
                                        />
                                    )}
                                    {q.type === "single" && (
                                        <div className="flex flex-wrap gap-2">
                                            {(q.options || []).map((opt: string) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setFormAnswers({ ...formAnswers, [q.id]: opt })}
                                                    className={`px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${formAnswers[q.id] === opt ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-500"}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {q.type === "multi" && (
                                        <div className="flex flex-wrap gap-2">
                                            {(q.options || []).map((opt: string) => {
                                                const current = (formAnswers[q.id] || "").split("|").filter(Boolean);
                                                const isSelected = current.includes(opt);
                                                return (
                                                    <button
                                                        key={opt}
                                                        onClick={() => {
                                                            const next = isSelected ? current.filter((c) => c !== opt) : [...current, opt];
                                                            setFormAnswers({ ...formAnswers, [q.id]: next.join("|") });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${isSelected ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-500"}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveForm(null)}
                                className="flex-1 py-2.5 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await submitForm({
                                        formId: activeForm._id,
                                        classId,
                                        answers: Object.entries(formAnswers).map(([questionId, value]) => ({ questionId, value })),
                                    });
                                    setActiveForm(null);
                                }}
                                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-widest"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {responsesFormId && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-md p-8 max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Form Responses</h3>
                            <button
                                onClick={() => setResponsesFormId(null)}
                                className="w-8 h-8 rounded-md border border-slate-200 text-slate-400 hover:text-slate-600"
                            >
                                X
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[50vh] overflow-auto">
                            {responses.length === 0 && (
                                <p className="text-xs text-slate-400 font-medium">No responses yet.</p>
                            )}
                            {responses.map((r: any) => (
                                <div key={r._id} className="p-3 rounded-md border border-slate-200 bg-slate-50">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">{r.studentId}</p>
                                    <div className="space-y-2">
                                        {r.answers.map((a: any) => (
                                            <div key={a.questionId} className="text-xs text-slate-600">
                                                <span className="font-bold">{getQuestionLabel(a.questionId)}</span>: {a.value}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PeopleView({ classId, user }: { classId: Id<"classes">; user: any }) {
    const members = useQuery(api.myFunctions.getClassMembers, { classId }) || [];
    const teacher = useQuery(api.myFunctions.getClassTeacher, { classId });
    const assignments = useQuery(api.myFunctions.getClassFiles, { classId }) || [];
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [note, setNote] = useState("");
    const [noteLevel, setNoteLevel] = useState<"note" | "concern" | "action">("note");
    const [activeSimilarity, setActiveSimilarity] = useState<{ assignmentId: Id<"files">; studentId: string } | null>(null);

    const timeline = useQuery(
        api.myFunctions.getStudentTimeline,
        selectedStudent ? { classId, studentId: selectedStudent.email } : "skip"
    ) || [];
    const missingAssignments = useQuery(
        api.myFunctions.getMissingAssignments,
        selectedStudent ? { classId, studentId: selectedStudent.email } : "skip"
    ) || [];
    const outcomeProgress = useQuery(
        api.myFunctions.getOutcomeProgress,
        selectedStudent ? { classId, studentId: selectedStudent.email } : "skip"
    ) || [];
    const submissions = useQuery(
        api.myFunctions.getStudentSubmissions,
        selectedStudent ? { classId, studentId: selectedStudent.email } : "skip"
    ) || [];
    const similarityReport = useQuery(
        api.myFunctions.getSimilarityReport,
        activeSimilarity ? { assignmentId: activeSimilarity.assignmentId, studentId: activeSimilarity.studentId } : "skip"
    ) || [];

    const recordAttendance = useMutation(api.myFunctions.recordAttendance);
    const addInterventionNote = useMutation(api.myFunctions.addInterventionNote);
    const createNudge = useMutation(api.myFunctions.createNudge);


    const getAssignmentName = (assignmentId: string) => {
        const found = assignments.find((a) => a._id === assignmentId);
        return found?.name || "Assignment";
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-8">
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
                                <div
                                    key={member.email}
                                    onClick={() => setSelectedStudent(member)}
                                    className={`premium-card p-4 flex items-center gap-4 group hover:border-emerald-500/30 transition-all cursor-pointer ${selectedStudent?.email === member.email ? "border-emerald-400" : ""}`}
                                >
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

                <div className="lg:col-span-2 space-y-6">
                    {!selectedStudent ? (
                        <div className="premium-card p-10 text-center text-slate-400 font-bold">Select a student to view the unified profile timeline.</div>
                    ) : (
                        <>
                            <div className="premium-card p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={selectedStudent.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.name)}&background=10b981&color=ffffff&bold=true`}
                                        className="w-14 h-14 rounded-md border border-slate-200 shadow-sm"
                                        alt={selectedStudent.name}
                                    />
                                    <div>
                                        <p className="text-lg font-bold text-slate-900">{selectedStudent.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedStudent.email}</p>
                                    </div>
                                </div>
                                {user.role === "teacher" && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => recordAttendance({ classId, studentId: selectedStudent.email, status: "present", date: Date.now() })}
                                            className="px-3 py-1.5 rounded-md border border-emerald-200 text-emerald-700 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-50"
                                        >
                                            Present
                                        </button>
                                        <button
                                            onClick={() => recordAttendance({ classId, studentId: selectedStudent.email, status: "tardy", date: Date.now() })}
                                            className="px-3 py-1.5 rounded-md border border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-widest hover:bg-amber-50"
                                        >
                                            Tardy
                                        </button>
                                        <button
                                            onClick={() => recordAttendance({ classId, studentId: selectedStudent.email, status: "absent", date: Date.now() })}
                                            className="px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 text-[9px] font-bold uppercase tracking-widest hover:bg-rose-50"
                                        >
                                            Absent
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="premium-card p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Outcome Badges</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {outcomeProgress.filter((o: any) => o.completed > 0).length === 0 && (
                                            <p className="text-xs text-slate-400 font-medium">No badges yet. Complete tagged assignments to earn them.</p>
                                        )}
                                        {outcomeProgress.filter((o: any) => o.completed > 0).map((o: any) => {
                                            const tier = o.completed >= 5 ? "Gold" : o.completed >= 3 ? "Silver" : "Bronze";
                                            return (
                                                <div key={o.outcome._id} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-widest border border-emerald-100">
                                                    {o.outcome.code} {tier}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="premium-card p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Missing Work</p>
                                    <div className="mt-3 space-y-2">
                                        {missingAssignments.length === 0 && (
                                            <p className="text-xs text-slate-400 font-medium">No missing assignments.</p>
                                        )}
                                        {missingAssignments.map((a: any) => (
                                            <div key={a._id} className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
                                                <span>{a.name}</span>
                                                {user.role === "teacher" && (
                                                    <button
                                                        onClick={() => createNudge({
                                                            classId,
                                                            studentId: selectedStudent.email,
                                                            assignmentId: a._id,
                                                            message: `Reminder: ${a.name} was due ${new Date(a.dueDate).toLocaleDateString()}.`,
                                                        })}
                                                        className="px-2 py-1 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                                    >
                                                        Nudge
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {user.role === "teacher" && (
                                <div className="premium-card p-6 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intervention Notes</p>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <select
                                            value={noteLevel}
                                            onChange={(e) => setNoteLevel(e.target.value as any)}
                                            className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-700"
                                        >
                                            <option value="note">Note</option>
                                            <option value="concern">Concern</option>
                                            <option value="action">Action</option>
                                        </select>
                                        <input
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="Add an intervention note..."
                                            className="md:col-span-3 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-700"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={async () => {
                                                if (!note.trim()) return;
                                                await addInterventionNote({ classId, studentId: selectedStudent.email, note, level: noteLevel });
                                                setNote("");
                                            }}
                                            className="bg-slate-900 text-white px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all"
                                        >
                                            Add Note
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="premium-card p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Unified Timeline</h3>
                                </div>
                                <div className="space-y-3">
                                    {timeline.length === 0 && (
                                        <p className="text-xs text-slate-400 font-medium">No timeline activity yet.</p>
                                    )}
                                    {timeline.map((event: any, idx: number) => (
                                        <div key={`${event.type}-${idx}`} className="flex items-start gap-3">
                                            <div className="w-2.5 h-2.5 mt-2 rounded-full bg-emerald-500"></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{event.title}</p>
                                                <p className="text-xs text-slate-500">{event.detail}</p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                                                    {new Date(event.ts).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="premium-card p-6 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Assignment Submissions</h3>
                                {submissions.length === 0 && (
                                    <p className="text-xs text-slate-400 font-medium">No submissions yet.</p>
                                )}
                                {submissions.map((s: any) => (
                                    <div key={s._id} className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-bold text-slate-800">{getAssignmentName(s.assignmentId)}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(s.submittedAt).toLocaleDateString()}</p>
                                        </div>
                                        {user.role === "teacher" && (
                                            <button
                                                onClick={() => setActiveSimilarity({ assignmentId: s.assignmentId, studentId: selectedStudent.email })}
                                                className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                            >
                                                Similarity
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {user.role === "teacher" && activeSimilarity && (
                                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Similarity Report</p>
                                        {similarityReport.length === 0 && (
                                            <p className="text-xs text-slate-400 font-medium">No comparable submissions yet.</p>
                                        )}
                                        {similarityReport.map((r: any) => (
                                            <div key={r.studentId} className="flex items-center justify-between text-xs text-slate-600">
                                                <span>{r.studentId.split("@")[0]}</span>
                                                <span className="font-bold">{Math.round(r.score * 100)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
