import { useState, useEffect, useMemo, useCallback } from "react";
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
import { AssignmentModal } from "./AssignmentModal";
import { ArrowLeft, MessageSquare, FileText, Users, Map, Trophy, Mail, BookOpen, MoreVertical, Camera, Loader2, GraduationCap, CheckCircle2, X, Zap, Link as LinkIcon, Presentation, ExternalLink, ClipboardList, Plus, Crown, User, CalendarDays, Send } from "lucide-react";
import { Composer } from "./Composer";
import { CalendarView } from "./CalendarView";
import { MessagesView } from "./MessagesView";

interface ClassViewProps {
    classId: Id<"classes">;
    user: any;
    onBack: () => void;
    onOpenSettings: () => void;
}

type ClassTab = "stream" | "classwork" | "people" | "grades" | "path" | "leaderboard" | "calendar" | "messages";

export function ClassView({ classId, user, onBack, onOpenSettings }: ClassViewProps) {
    const [activeTab, setActiveTab] = useState<ClassTab>("stream");
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const classData = useQuery(api.myFunctions.getClassById, { classId });

    if (!classData) return <div className="p-10 text-slate-400 font-bold animate-pulse text-center">Loading Class...</div>;

    const teacherTabs: ClassTab[] = ["stream", "classwork", "people", "grades", "path", "leaderboard", "calendar", "messages"];
    const studentTabs: ClassTab[] = ["stream", "classwork", "people", "path", "leaderboard", "calendar", "messages"];
    const tabs = user.role === "teacher" ? teacherTabs : studentTabs;
    const getDesktopTabLabel = (tab: ClassTab) => {
        if (tab === "grades") return "Analytics";
        if (tab === "classwork") return "Classwork";
        if (tab === "leaderboard") return "Leaderboard";
        if (tab === "calendar") return "Calendar";
        if (tab === "messages") return "Messages";
        if (tab === "stream") return "Stream";
        if (tab === "people") return "People";
        if (tab === "path") return "Path";
        return tab;
    };
    const getMobileTabLabel = (tab: ClassTab) => {
        if (tab === "classwork") return "work";
        if (tab === "leaderboard") return "board";
        if (tab === "grades") return "grades";
        if (tab === "messages") return "chat";
        if (tab === "calendar") return "cal";
        return tab;
    };

    return (
        <div className="animate-in fade-in duration-500 px-3 sm:px-4 md:px-8 pt-6 flex flex-col items-center">
            {/* Centered Navigation & User Stats Bar */}
            <nav className="w-full max-w-6xl mx-auto mb-8 hidden md:block">
                <div className="flex items-center justify-between gap-4 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl px-4 py-3 shadow-sm relative z-20">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center text-slate-400 shadow-sm group shrink-0"
                        title="Back to Hub"
                        aria-label="Back to classes"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    {/* Centered Navigation Tabs */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 p-1 bg-slate-100/70 border border-slate-200 rounded-xl items-center hidden md:grid w-full max-w-4xl"
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
                                className={`relative z-10 py-1.5 text-[11px] font-bold tracking-[0.03em] flex items-center justify-center gap-1.5 transition-colors duration-300 ${activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-800"
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
                                {tab === "calendar" && <CalendarDays className="w-3 h-3" />}
                                {tab === "messages" && <Send className="w-3 h-3" />}
                                <span className="hidden xl:inline">{getDesktopTabLabel(tab)}</span>
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

            <div className="md:hidden sticky top-[max(env(safe-area-inset-top),0px)] z-40 w-full mb-4">
                <div className="w-full max-w-6xl mx-auto rounded-xl border border-slate-200 bg-white/85 backdrop-blur-xl px-3 py-2 shadow-sm flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0"
                        aria-label="Back to classes"
                        title="Back to classes"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{classData.name}</p>
                        <p className="text-xs font-medium text-slate-500">Class view</p>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg border border-emerald-200/50 bg-emerald-50 text-emerald-700 text-xs font-bold">
                        {user.xp || 0} XP
                    </div>
                </div>
            </div>

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
                                {tab === "calendar" && <CalendarDays className="w-5 h-5 transition-transform group-active:scale-95" />}
                                {tab === "messages" && <Send className="w-5 h-5 transition-transform group-active:scale-95" />}
                                <span className="text-[10px] font-semibold tracking-wide leading-none opacity-90 capitalize">{getMobileTabLabel(tab)}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={onOpenSettings}
                    className="mx-2 w-10 h-10 rounded-xl border border-slate-200 bg-white/90 shadow-sm flex items-center justify-center"
                    title="Settings"
                    aria-label="Open settings"
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
                {activeTab === "leaderboard" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><Scoreboard classId={classId} user={user} /></div>}
                {activeTab === "calendar" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><CalendarView classId={classId} user={user} /></div>}
                {activeTab === "messages" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><MessagesView classId={classId} user={user} /></div>}
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
    const [activeForm, setActiveForm] = useState<any>(null);
    const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
    const [mood, setMood] = useState("Focused");
    const [goal, setGoal] = useState("");
    const [blocker, setBlocker] = useState("");
    const [submittingReflection, setSubmittingReflection] = useState(false);
    const featureApi = (api as any).featureFunctions;
    const pinStreamEntry = useMutation(featureApi.pinStreamEntry);


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
            <div className={`h-52 md:h-64 lg:h-72 w-full relative -mt-2 p-6 md:p-10 flex flex-col justify-end text-white overflow-hidden rounded-3xl shadow-2xl border border-slate-200/20 group z-0 ${!bannerUrl ? 'bg-slate-900' : ''}`}>
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

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent"></div>

                <div className="relative z-10 flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow-sm">{classData.name}</h2>
                            <div className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg border border-white/20 text-[11px] font-semibold tracking-[0.08em]">
                                {classData.code}
                            </div>
                        </div>
                        <p className="text-emerald-300 font-semibold uppercase tracking-[0.1em] text-[11px]">{classData.description || "Academic Year 2026"}</p>
                    </div>

                    {user.role === "teacher" && (
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                id="banner-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={(event) => {
                                    void handleBannerUpload(event);
                                }}
                                disabled={isUploadingBanner}
                            />
                            <label
                                htmlFor="banner-upload"
                                className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3.5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-[0.08em] transition-all cursor-pointer border border-white/20 ${isUploadingBanner ? 'opacity-50' : ''}`}
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
                                    onClick={() => {
                                        void (async () => {
                                            setSubmittingReflection(true);
                                            try {
                                                await createReflection({ classId: classData._id, mood, goal, blocker });
                                                setGoal("");
                                                setBlocker("");
                                            } finally {
                                                setSubmittingReflection(false);
                                            }
                                        })();
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
                                                        onClick={() => {
                                                            void setFormActive({ formId: form._id, isOpen: false });
                                                        }}
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
                        <div className="text-center py-20 rounded-3xl bg-slate-50/50 border border-dashed border-slate-300/80">
                            <div className="text-emerald-300 mb-3 flex justify-center">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <p className="text-slate-500 font-medium text-base">No activity yet. Post the first update to get started.</p>
                        </div>
                    ) : (
                        entries.map((entry: any) => (
                            <div key={entry._id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {entry.entryType === "announcement" && (
                                    <div className="premium-card p-6 rounded-2xl space-y-4 shadow-lg shadow-slate-900/5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <MessageSquare className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 leading-none mb-1">
                                                        {entry.authorEmail.split("@")[0]} posted an update
                                                    </p>
                                                    <p className="text-[11px] font-medium text-slate-400">
                                                        {new Date(entry._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                            </div>
                                            {user.role === "teacher" && (
                                                <button
                                                    onClick={() => {
                                                        void pinStreamEntry({
                                                            classId: classData._id,
                                                            entryType: "announcement",
                                                            entryId: entry._id,
                                                            pinned: !entry.pinned,
                                                        });
                                                    }}
                                                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${entry.pinned ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                                                >
                                                    {entry.pinned ? "Pinned" : "Pin"}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[15px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {entry.content}
                                        </p>
                                        <div className="pt-2 border-t border-slate-100">
                                            <EntryEngagementBar classId={classData._id} entry={entry} user={user} />
                                        </div>
                                    </div>
                                )}

                                {entry.entryType === "quiz" && (
                                    <div className="premium-card overflow-hidden group rounded-2xl shadow-lg shadow-slate-900/5">
                                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 flex items-center justify-between text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                                    <GraduationCap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-semibold tracking-[0.08em] opacity-75 uppercase">Interactive Quiz</p>
                                                    <h4 className="text-sm font-bold tracking-tight">{entry.title}</h4>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-75">Award</p>
                                                <p className="text-xs font-black">{entry.xpValue} XP</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 text-slate-400">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[12px] font-semibold tracking-wide">{entry.questions.length} questions</span>
                                            </div>
                                            <button
                                                onClick={() => setActiveQuiz(entry)}
                                                className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-semibold text-[12px] tracking-wide hover:bg-emerald-600 transition-all shadow-md shadow-slate-900/10"
                                            >
                                                Start Quiz
                                            </button>
                                        </div>
                                        <div className="px-6 py-4 border-t border-slate-100">
                                            <EntryEngagementBar classId={classData._id} entry={entry} user={user} />
                                        </div>
                                    </div>
                                )}

                                {entry.entryType === "file" && (
                                    <>
                                        <div
                                            onClick={() => onFileSelect(entry)}
                                            className="premium-card p-5 rounded-2xl flex items-start gap-4 group hover:border-emerald-500/30 transition-all cursor-pointer shadow-lg shadow-slate-900/5"
                                        >
                                            <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-500 mb-1">
                                                            {entry.uploadedBy.split("@")[0]} {entry.isAssignment ? "posted homework" : "shared a resource"}
                                                        </p>
                                                        <h4 className="text-base font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                                                            {entry.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <p className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                                {new Date(entry._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                            </p>
                                                            {entry.isAssignment && (
                                                                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">Assignment</span>
                                                            )}
                                                            {entry.isAssignment && entry.dueDate && (
                                                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                                                                    Due {new Date(entry.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button className="w-8 h-8 rounded-md hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors">
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-2 pt-2">
                                            <EntryEngagementBar classId={classData._id} entry={entry} user={user} />
                                        </div>
                                    </>
                                )}

                                {entry.entryType === "link" && (
                                    <>
                                        <div
                                            onClick={() => window.open(entry.url, "_blank")}
                                            className="premium-card p-5 rounded-2xl flex items-start gap-4 group hover:border-emerald-500/30 transition-all cursor-pointer shadow-lg shadow-slate-900/5"
                                        >
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${entry.isWhiteboard ? "bg-violet-50 text-violet-600 border-violet-100 group-hover:bg-violet-600 group-hover:text-white" : "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white"}`}>
                                                {entry.isWhiteboard ? <Presentation className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-500 mb-1">
                                                            {entry.createdBy.split("@")[0]} shared a {entry.isWhiteboard ? "whiteboard" : "link"}
                                                        </p>
                                                        <h4 className="text-base font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                                                            {entry.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <p className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                                {new Date(entry._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                            </p>
                                                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
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
                                        <div className="px-2 pt-2">
                                            <EntryEngagementBar classId={classData._id} entry={entry} user={user} />
                                        </div>
                                    </>
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
                                onClick={() => {
                                    void (async () => {
                                        const missingRequired = (activeForm.questions || []).filter((q: any) => q.required && !(formAnswers[q.id] || "").trim());
                                        if (missingRequired.length > 0) {
                                            window.alert(`Please answer required question: ${missingRequired[0].label}`);
                                            return;
                                        }
                                        await submitForm({
                                            formId: activeForm._id,
                                            classId: classData._id,
                                            answers: Object.entries(formAnswers).map(([questionId, value]) => ({ questionId, value })),
                                        });
                                        setActiveForm(null);
                                    })();
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

function EntryEngagementBar({ classId, entry, user: _user }: { classId: Id<"classes">; entry: any; user: any }) {
    const featureApi = (api as any).featureFunctions;
    const comments = useQuery(featureApi.getStreamComments, {
        classId,
        entryType: entry.entryType,
        entryId: String(entry._id),
    }) || [];

    const addStreamComment = useMutation(featureApi.addStreamComment);

    const [openComments, setOpenComments] = useState(false);
    const [draftComment, setDraftComment] = useState("");

    const submitComment = async () => {
        const content = draftComment.trim();
        if (!content) return;
        await addStreamComment({
            classId,
            entryType: entry.entryType,
            entryId: String(entry._id),
            content,
        });
        setDraftComment("");
        setOpenComments(true);
    };

    return (
        <div className="space-y-3" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">
                    {comments.length === 0 ? "No comments yet" : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
                </p>
                <button
                    onClick={() => setOpenComments((prev) => !prev)}
                    className="text-xs font-semibold tracking-wide text-slate-500 hover:text-slate-700"
                >
                    {openComments ? "Hide comments" : "Comments"} ({comments.length})
                </button>
            </div>

            {openComments && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="space-y-1 max-h-40 overflow-auto">
                        {comments.length === 0 && (
                            <p className="text-xs text-slate-400 font-medium">No comments yet.</p>
                        )}
                        {comments.map((comment: any) => (
                            <div key={comment._id} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                                <p className="text-[11px] font-semibold text-slate-500">{comment.authorEmail?.split("@")[0]}</p>
                                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            value={draftComment}
                            onChange={(event) => setDraftComment(event.target.value)}
                            placeholder="Add comment"
                            className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700"
                        />
                        <button
                            onClick={() => {
                                void submitComment();
                            }}
                            disabled={!draftComment.trim()}
                            className="px-3.5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold tracking-wide hover:bg-slate-800 disabled:opacity-50"
                        >
                            Post
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function QuizPlayer({ quiz, onClose, onComplete }: { quiz: any; onClose: () => void; onComplete: (score: number) => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [typedAnswer, setTypedAnswer] = useState("");
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [allowRetake, setAllowRetake] = useState(false);
    const [xpAwarded, setXpAwarded] = useState<number | null>(null);
    const [submissionError, setSubmissionError] = useState("");

    // Timer state
    const [timerActive, setTimerActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : 0);
    const [timerStarted, setTimerStarted] = useState(false);
    const preparedQuestions = useMemo(() => {
        const hashString = (value: string) => {
            let hash = 0;
            for (let idx = 0; idx < value.length; idx += 1) {
                hash = (hash * 31 + value.charCodeAt(idx)) >>> 0;
            }
            return hash;
        };
        const deterministicShuffle = <T,>(
            items: T[],
            seed: string,
            keyFor: (item: T, index: number) => string
        ) =>
            [...items]
                .map((item, index) => ({
                    item,
                    rank: hashString(`${seed}:${keyFor(item, index)}:${index}`),
                }))
                .sort((a, b) => a.rank - b.rank)
                .map((entry) => entry.item);

        const seed = String(quiz._id || "quiz");
        let questions = [...(quiz.questions || [])];
        if (quiz.randomizeOptions) {
            questions = questions.map((question: any, questionIndex: number) => {
                if (!Array.isArray(question.options) || question.options.length === 0) return question;
                const original = question.options.map((option: string, index: number) => ({ option, index }));
                const shuffled = deterministicShuffle<{ option: string; index: number }>(
                    original,
                    `${seed}:options:${questionIndex}`,
                    (entry: { option: string; index: number }, index: number) => `${entry.option}:${entry.index}:${index}`
                );
                return {
                    ...question,
                    options: shuffled.map((entry: { option: string; index: number }) => entry.option),
                    correctOption: shuffled.findIndex((entry: { option: string; index: number }) => entry.index === question.correctOption),
                };
            });
        }
        if (quiz.randomizeQuestions) {
            questions = deterministicShuffle(
                questions,
                `${seed}:questions`,
                (question: any, index) => `${question.question || ""}:${question.correctOption ?? ""}:${index}`
            );
        }
        return questions;
    }, [quiz._id, quiz.questions, quiz.randomizeOptions, quiz.randomizeQuestions]);

    // XP calculation
    const xpPerCorrect = quiz.xpPerQuestion || 5;

    const featureApi = (api as any).featureFunctions;
    const completeQuizMutation = useMutation(featureApi.completeAdvancedQuiz);
    const attemptInfo = useQuery(featureApi.getQuizAttemptInfo, { quizId: quiz._id });
    const hasSubmitted = (attemptInfo?.attempts || 0) > 0;
    const attemptsLeft = quiz.maxAttempts ? Math.max(0, quiz.maxAttempts - (attemptInfo?.attempts || 0)) : null;

    const handleAutoSubmit = useCallback(async () => {
        setIsFinished(true);
        setSubmissionError("");
        try {
            const result = await completeQuizMutation({
                quizId: quiz._id,
                score,
                totalQuestions: preparedQuestions.length
            });
            setXpAwarded(result?.xpAwarded ?? 0);
        } catch (err) {
            console.error("Auto-submit failed:", err);
            setSubmissionError("Could not auto-submit. Try again.");
        }
    }, [completeQuizMutation, preparedQuestions.length, quiz._id, score]);

    // Timer effect
    useEffect(() => {
        if (!timerActive || timeRemaining <= 0 || !quiz.timeLimitMinutes) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    void handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [handleAutoSubmit, quiz.timeLimitMinutes, timerActive, timeRemaining]);

    const handleNext = async () => {
        const isLastQuestion = currentStep === preparedQuestions.length - 1;
        const activeQuestion = preparedQuestions[currentStep];
        const questionType = activeQuestion.questionType || "mcq";
        const normalizedTyped = typedAnswer.trim();
        const isCorrect =
            questionType === "short"
                ? normalizedTyped.toLowerCase() === String(activeQuestion.correctAnswerText || "").trim().toLowerCase()
                : questionType === "numeric"
                    ? normalizedTyped !== "" && Number(normalizedTyped) === Number(activeQuestion.correctNumber)
                    : selectedOption === activeQuestion.correctOption;
        const newScore = isCorrect ? score + 1 : score;

        if (isCorrect) {
            setScore(newScore);
        }

        if (!isLastQuestion) {
            setCurrentStep(currentStep + 1);
            setSelectedOption(null);
            setTypedAnswer("");
        } else {
            setIsFinished(true);
            setTimerActive(false);
            setSubmissionError("");
            try {
                const result = await completeQuizMutation({
                    quizId: quiz._id,
                    score: newScore,
                    totalQuestions: preparedQuestions.length
                });
                setXpAwarded(result?.xpAwarded ?? 0);
            } catch (err) {
                console.error("Failed to submit quiz:", err);
                setSubmissionError("Quiz submission failed. Check attempts/due date.");
            }
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Loading state for submission check
    if (attemptInfo === undefined) {
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
    if (quiz.singleAttempt && hasSubmitted && !isFinished && !allowRetake) {
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

    if (!quiz.singleAttempt && quiz.maxAttempts && attemptsLeft === 0 && !isFinished) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mx-auto text-2xl">⛔</div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Attempts Exhausted</h3>
                        <p className="text-slate-500 font-medium text-sm">You reached the maximum number of attempts for this quiz.</p>
                    </div>
                    <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all">
                        Close
                    </button>
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
                        <p className="text-slate-500 font-medium text-sm">This is a timed quiz. You have <strong>{quiz.timeLimitMinutes} minutes</strong> to complete {preparedQuestions.length} questions.</p>
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
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Question {currentStep + 1} of {preparedQuestions.length}</p>
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
                                {submissionError && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] font-bold text-rose-700 uppercase tracking-widest">
                                        {submissionError}
                                    </div>
                                )}
                            <h4 className="text-lg font-bold text-slate-900 leading-tight">
                                {preparedQuestions[currentStep].question}
                            </h4>
                            {(preparedQuestions[currentStep].questionType === "short" || preparedQuestions[currentStep].questionType === "numeric") ? (
                                <div className="space-y-3">
                                    <input
                                        type={preparedQuestions[currentStep].questionType === "numeric" ? "number" : "text"}
                                        value={typedAnswer}
                                        onChange={(e) => setTypedAnswer(e.target.value)}
                                        placeholder={preparedQuestions[currentStep].questionType === "numeric" ? "Enter numeric answer" : "Enter short answer"}
                                        className="w-full p-4 rounded-xl border-2 border-slate-100 text-left transition-all font-bold text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {preparedQuestions[currentStep].options.map((option: string, i: number) => (
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
                            )}
                            <button
                                onClick={() => {
                                    void handleNext();
                                }}
                                disabled={
                                    (preparedQuestions[currentStep].questionType === "short" || preparedQuestions[currentStep].questionType === "numeric")
                                        ? !typedAnswer.trim()
                                        : selectedOption === null
                                }
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10"
                            >
                                {currentStep === preparedQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
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
                            <p className="text-slate-500 font-medium">You scored {score} out of {preparedQuestions.length}</p>
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
    const mySubmissions = useQuery(
        api.myFunctions.getStudentSubmissions,
        user.role === "student" ? { classId, studentId: user.email } : "skip"
    ) || [];
    const createOutcome = useMutation(api.myFunctions.createOutcome);
    const createForm = useMutation(api.myFunctions.createForm);
    const submitForm = useMutation(api.myFunctions.submitForm);
    const featureApi = (api as any).featureFunctions;
    const updateFormDefinition = useMutation(featureApi.updateFormDefinition);

    const [isOutcomeOpen, setIsOutcomeOpen] = useState(false);
    const [outcomeCode, setOutcomeCode] = useState("");
    const [outcomeTitle, setOutcomeTitle] = useState("");
    const [outcomeDesc, setOutcomeDesc] = useState("");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formCategory, setFormCategory] = useState<"survey" | "permission" | "field_trip">("survey");
    const [formQuestions, setFormQuestions] = useState<any[]>([]);
    const [formEnforceOneResponse, setFormEnforceOneResponse] = useState(true);
    const [activeForm, setActiveForm] = useState<any>(null);
    const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
    const [responsesFormId, setResponsesFormId] = useState<Id<"forms"> | null>(null);
    const [selectedAssignmentFile, setSelectedAssignmentFile] = useState<any>(null);
    const [editingAssignmentFile, setEditingAssignmentFile] = useState<any>(null);
    const responses = useQuery(api.myFunctions.getFormResponses, responsesFormId ? { formId: responsesFormId } : "skip") || [];
    const responsesAnalytics = useQuery(
        featureApi.getFormAnalytics,
        responsesFormId ? { formId: responsesFormId } : "skip"
    );

    const assignmentFiles = useMemo(
        () =>
            files
                .filter((file: any) => file.isAssignment)
                .sort((left: any, right: any) => {
                    const dueLeft = left.dueDate ?? Number.MAX_SAFE_INTEGER;
                    const dueRight = right.dueDate ?? Number.MAX_SAFE_INTEGER;
                    if (dueLeft !== dueRight) return dueLeft - dueRight;
                    return right._creationTime - left._creationTime;
                }),
        [files]
    );
    const resourceFiles = useMemo(
        () => files.filter((file: any) => !file.isAssignment),
        [files]
    );
    const submissionByAssignment = useMemo(() => {
        const latestByAssignment = new globalThis.Map<string, any>();
        mySubmissions.forEach((submission: any) => {
            const current = latestByAssignment.get(submission.assignmentId);
            if (!current || submission.submittedAt > current.submittedAt) {
                latestByAssignment.set(submission.assignmentId, submission);
            }
        });
        return latestByAssignment;
    }, [mySubmissions]);

    const nowMs = Date.now();
    const dueSoonBoundary = nowMs + 7 * 24 * 60 * 60 * 1000;
    const dueSoonCount = assignmentFiles.filter(
        (assignment: any) => assignment.dueDate && assignment.dueDate >= nowMs && assignment.dueDate <= dueSoonBoundary
    ).length;
    const overdueCount = assignmentFiles.filter((assignment: any) => {
        if (!assignment.dueDate || assignment.dueDate >= nowMs) return false;
        if (user.role !== "student") return true;
        return !submissionByAssignment.has(assignment._id);
    }).length;
    const studentSubmittedCount =
        user.role === "student"
            ? assignmentFiles.filter((assignment: any) => submissionByAssignment.has(assignment._id)).length
            : 0;

    const getAssignmentStatus = (assignment: any) => {
        const submission = submissionByAssignment.get(assignment._id);
        const isPastDue = !!assignment.dueDate && assignment.dueDate < nowMs;
        const isDueSoon = !!assignment.dueDate && assignment.dueDate >= nowMs && assignment.dueDate <= dueSoonBoundary;

        if (user.role === "student") {
            if (submission) {
                return {
                    label: submission.isLate ? "Submitted Late" : "Submitted",
                    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
                };
            }
            if (isPastDue) {
                return {
                    label: "Missing",
                    tone: "border-rose-200 bg-rose-50 text-rose-700",
                };
            }
            if (isDueSoon) {
                return {
                    label: "Due Soon",
                    tone: "border-amber-200 bg-amber-50 text-amber-700",
                };
            }
            return {
                label: assignment.dueDate ? "In Progress" : "Open",
                tone: "border-slate-200 bg-slate-50 text-slate-600",
            };
        }

        if (isPastDue) {
            return {
                label: "Past Due",
                tone: "border-rose-200 bg-rose-50 text-rose-700",
            };
        }
        if (isDueSoon) {
            return {
                label: "Due Soon",
                tone: "border-amber-200 bg-amber-50 text-amber-700",
            };
        }
        return {
            label: assignment.dueDate ? "Scheduled" : "No Deadline",
            tone: "border-slate-200 bg-slate-50 text-slate-600",
        };
    };

    const newQuestionId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    const responsesForm = forms.find((f: any) => f._id === responsesFormId);
    const getQuestionLabel = (questionId: string) => {
        const found = responsesForm?.questions?.find((q: any) => q.id === questionId);
        return found?.label || questionId;
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="premium-card p-5 md:p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Assignments</h2>
                        <p className="text-sm text-slate-500 font-medium">Structured work queue with due-date visibility and status tracking.</p>
                    </div>
                    {user.role === "teacher" && (
                        <UploadButton classId={classId} isAssignment={true} />
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
                        <p className="text-xl font-black text-slate-900">{assignmentFiles.length}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">Due Soon</p>
                        <p className="text-xl font-black text-amber-700">{dueSoonCount}</p>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-600">{user.role === "student" ? "Missing" : "Past Due"}</p>
                        <p className="text-xl font-black text-rose-700">{overdueCount}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">{user.role === "student" ? "Submitted" : "Resources"}</p>
                        <p className="text-xl font-black text-emerald-700">{user.role === "student" ? studentSubmittedCount : resourceFiles.length}</p>
                    </div>
                </div>

                {assignmentFiles.length === 0 ? (
                    <div className="text-center py-10 rounded-md bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                        No assignments posted yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {assignmentFiles.map((assignment: any) => {
                            const dueAtLabel = assignment.dueDate
                                ? new Date(assignment.dueDate).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                })
                                : "No deadline";
                            const status = getAssignmentStatus(assignment);
                            const questionsCount = (assignment.questionPrompts || []).length;
                            const outcomeCount = (assignment.outcomeIds || []).length;
                            const instructions = assignment.instructions
                                ? assignment.instructions.length > 150
                                    ? `${assignment.instructions.slice(0, 150)}...`
                                    : assignment.instructions
                                : "No instructions yet. Add details to clarify expectations.";
                            const submission = submissionByAssignment.get(assignment._id);
                            const submittedLabel = submission
                                ? new Date(submission.submittedAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                                : null;

                            return (
                                <div key={assignment._id} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{assignment.name}</p>
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
                                                Posted {new Date(assignment._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </p>
                                        </div>
                                        <span className="shrink-0 px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                            {dueAtLabel}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-600 leading-relaxed">{instructions}</p>

                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                            {questionsCount} prompt{questionsCount === 1 ? "" : "s"}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[9px] font-bold uppercase tracking-widest text-emerald-700">
                                            {outcomeCount} outcome{outcomeCount === 1 ? "" : "s"}
                                        </span>
                                        {assignment.maxResubmissions !== undefined && (
                                            <span className="px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-[9px] font-bold uppercase tracking-widest text-amber-700">
                                                {assignment.maxResubmissions} resubmissions
                                            </span>
                                        )}
                                        {user.role === "student" && submittedLabel && (
                                            <span className="px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[9px] font-bold uppercase tracking-widest text-emerald-700">
                                                Submitted {submittedLabel}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest ${status.tone}`}>
                                            {status.label}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setSelectedAssignmentFile(assignment)}
                                                className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                            >
                                                Open
                                            </button>
                                            {user.role === "teacher" && (
                                                <button
                                                    onClick={() => setEditingAssignmentFile(assignment)}
                                                    className="px-3 py-1.5 rounded-md border border-emerald-200 text-[9px] font-bold uppercase tracking-widest text-emerald-700 hover:bg-emerald-50"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Resources</h3>
                        <p className="text-sm text-slate-500 font-medium">Reference docs, slides, and attached class materials.</p>
                    </div>
                    {user.role === "teacher" && (
                        <UploadButton classId={classId} />
                    )}
                </div>

                {resourceFiles.length === 0 ? (
                    <div className="text-center py-10 rounded-md bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                        No standalone resources uploaded yet.
                    </div>
                ) : (
                    <FileGrid files={resourceFiles} userRole={user.role} />
                )}
            </div>

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
                                setFormQuestions([{ id: newQuestionId(), label: "Question", type: "short", required: false }]);
                                setFormEnforceOneResponse(true);
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
                                <div className="flex flex-wrap gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-widest ${form.isOpen ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                                        {form.isOpen ? "Open" : "Closed"}
                                    </span>
                                    {form.enforceOneResponse && (
                                        <span className="px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-[8px] font-bold uppercase tracking-widest text-amber-700">
                                            One Response
                                        </span>
                                    )}
                                </div>
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
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => {
                                                    void updateFormDefinition({ formId: form._id, isOpen: !form.isOpen });
                                                }}
                                                className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                            >
                                                {form.isOpen ? "Close" : "Reopen"}
                                            </button>
                                            <button
                                                onClick={() => setResponsesFormId(form._id)}
                                                className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                                            >
                                                Responses
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {assignmentFiles.length === 0 && resourceFiles.length === 0 && links.length === 0 && (
                <div className="text-center py-16 rounded-md bg-slate-50 border border-dashed border-slate-200">
                    <div className="flex justify-center mb-4 text-emerald-200">
                        <FileText className="w-10 h-10" />
                    </div>
                    <p className="text-slate-400 font-bold italic text-sm">No classwork shared yet in this workspace.</p>
                    {user.role !== "student" && (
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-2">Post an assignment or upload a resource to get started</p>
                    )}
                </div>
            )}

            {selectedAssignmentFile && (
                <FileViewer
                    file={selectedAssignmentFile}
                    onClose={() => setSelectedAssignmentFile(null)}
                    userRole={user.role}
                />
            )}

            {editingAssignmentFile && (
                <AssignmentModal
                    file={editingAssignmentFile}
                    onClose={() => setEditingAssignmentFile(null)}
                />
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
                                onClick={() => {
                                    void (async () => {
                                        if (!outcomeCode || !outcomeTitle) return;
                                        await createOutcome({ classId, code: outcomeCode, title: outcomeTitle, description: outcomeDesc });
                                        setOutcomeCode("");
                                        setOutcomeTitle("");
                                        setOutcomeDesc("");
                                        setIsOutcomeOpen(false);
                                    })();
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
                        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Limit to one response per student</p>
                            <button
                                onClick={() => setFormEnforceOneResponse((prev) => !prev)}
                                className={`w-10 h-5 rounded-full transition-all relative ${formEnforceOneResponse ? "bg-emerald-500" : "bg-slate-300"}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${formEnforceOneResponse ? "left-5" : "left-0.5"}`}></div>
                            </button>
                        </div>
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
                                    <label className="md:col-span-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <input
                                            type="checkbox"
                                            checked={!!q.required}
                                            onChange={(e) => {
                                                const next = [...formQuestions];
                                                next[idx] = { ...next[idx], required: e.target.checked };
                                                setFormQuestions(next);
                                            }}
                                        />
                                        Required
                                    </label>
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
                                onClick={() => setFormQuestions([...formQuestions, { id: newQuestionId(), label: "Question", type: "short", required: false }])}
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
                                    onClick={() => {
                                        void (async () => {
                                            if (!formTitle || formQuestions.length === 0) return;
                                            const payload = formQuestions.map((q) => ({
                                                id: q.id,
                                                label: q.label,
                                                type: q.type,
                                                options: q.options ? q.options.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
                                                required: !!q.required,
                                            }));
                                            await createForm({
                                                classId,
                                                title: formTitle,
                                                description: formDesc,
                                                category: formCategory,
                                                questions: payload,
                                                enforceOneResponse: formEnforceOneResponse,
                                            } as any);
                                            setFormTitle("");
                                            setFormDesc("");
                                            setFormQuestions([]);
                                            setFormEnforceOneResponse(true);
                                            setIsFormOpen(false);
                                        })();
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
                                onClick={() => {
                                    void (async () => {
                                        const missingRequired = (activeForm.questions || []).filter((q: any) => q.required && !(formAnswers[q.id] || "").trim());
                                        if (missingRequired.length > 0) {
                                            window.alert(`Please answer required question: ${missingRequired[0].label}`);
                                            return;
                                        }
                                        await submitForm({
                                            formId: activeForm._id,
                                            classId,
                                            answers: Object.entries(formAnswers).map(([questionId, value]) => ({ questionId, value })),
                                        });
                                        setActiveForm(null);
                                    })();
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
                            {responsesAnalytics && (
                                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                                    <span>{responsesAnalytics.totalResponses} responses</span>
                                    <span>{responsesAnalytics.completionRate}% complete</span>
                                </div>
                            )}
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
    const featureApi = (api as any).featureFunctions;
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [note, setNote] = useState("");
    const [noteLevel, setNoteLevel] = useState<"note" | "concern" | "action">("note");
    const [activeSimilarity, setActiveSimilarity] = useState<{ assignmentId: Id<"files">; studentId: string } | null>(null);
    const [inviteHours, setInviteHours] = useState(24);
    const [latestInviteCode, setLatestInviteCode] = useState("");
    const [compareLeftId, setCompareLeftId] = useState("");
    const [compareRightId, setCompareRightId] = useState("");
    const [taskAssignee, setTaskAssignee] = useState("");
    const [taskDueAt, setTaskDueAt] = useState("");

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
    const joinRequests = useQuery(
        featureApi.getJoinRequests,
        user.role === "teacher" ? { classId } : "skip"
    ) || [];
    const analytics = useQuery(
        featureApi.getClassAnalyticsOverview,
        user.role === "teacher" ? { classId } : "skip"
    );
    const interventionTasks = useQuery(
        featureApi.getInterventionTasks,
        selectedStudent ? { classId, studentId: selectedStudent.email } : { classId }
    ) || [];
    const comparedPair = useQuery(
        featureApi.compareSubmissionPair,
        compareLeftId && compareRightId ? { leftSubmissionId: compareLeftId, rightSubmissionId: compareRightId } : "skip"
    );

    const recordAttendance = useMutation(api.myFunctions.recordAttendance);
    const addInterventionNote = useMutation(api.myFunctions.addInterventionNote);
    const createNudge = useMutation(api.myFunctions.createNudge);
    const createClassInvite = useMutation(featureApi.createClassInvite);
    const reviewJoinRequest = useMutation(featureApi.reviewJoinRequest);
    const createInterventionTask = useMutation(featureApi.createInterventionTask);
    const updateInterventionTask = useMutation(featureApi.updateInterventionTask);


    const getAssignmentName = (assignmentId: string) => {
        const found = assignments.find((a) => a._id === assignmentId);
        return found?.name || "Assignment";
    };
    const comparisonCandidates = submissions.filter((submission: any) => !!submission.content);
    const leftSubmission = comparisonCandidates.find((submission: any) => submission._id === compareLeftId);
    const rightCandidates = leftSubmission
        ? comparisonCandidates.filter((submission: any) => submission.assignmentId === leftSubmission.assignmentId && submission._id !== leftSubmission._id)
        : comparisonCandidates;

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

                    {user.role === "teacher" && (
                        <div className="premium-card p-4 space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Enrollment</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Invites and join approvals</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    value={inviteHours}
                                    onChange={(e) => setInviteHours(Math.max(1, Number(e.target.value) || 1))}
                                    className="w-24 px-2.5 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700"
                                />
                                <button
                                    onClick={() => {
                                        void (async () => {
                                            const invite = await createClassInvite({ classId, expiresInHours: inviteHours });
                                            setLatestInviteCode(invite?.code || "");
                                        })();
                                    }}
                                    className="flex-1 px-3 py-2 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all"
                                >
                                    Generate Invite
                                </button>
                            </div>
                            {latestInviteCode && (
                                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-700">Latest Invite</p>
                                    <p className="text-sm font-black text-emerald-800 tracking-[0.15em]">{latestInviteCode}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Join Requests</p>
                                {joinRequests.length === 0 && (
                                    <p className="text-xs text-slate-400 font-medium">No pending requests.</p>
                                )}
                                {joinRequests
                                    .filter((request: any) => request.status === "pending")
                                    .map((request: any) => (
                                        <div key={request._id} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 space-y-2">
                                            <p className="text-xs font-bold text-slate-700">{request.student?.name || request.studentId}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{request.studentId}</p>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        void reviewJoinRequest({ requestId: request._id, decision: "approved" });
                                                    }}
                                                    className="flex-1 px-2 py-1.5 rounded-md border border-emerald-200 text-emerald-700 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-50"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        void reviewJoinRequest({ requestId: request._id, decision: "rejected" });
                                                    }}
                                                    className="flex-1 px-2 py-1.5 rounded-md border border-rose-200 text-rose-700 text-[9px] font-bold uppercase tracking-widest hover:bg-rose-50"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

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
                    {user.role === "teacher" && analytics && (
                        <div className="premium-card p-5 grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Students</p>
                                <p className="text-xl font-black text-slate-900">{analytics.totalStudents}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Assignments</p>
                                <p className="text-xl font-black text-slate-900">{analytics.totalAssignments}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Submissions</p>
                                <p className="text-xl font-black text-slate-900">{analytics.totalSubmissions}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Avg XP</p>
                                <p className="text-xl font-black text-emerald-700">{analytics.averageXp}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">At-Risk</p>
                                <p className="text-xl font-black text-rose-600">{analytics.atRisk?.length || 0}</p>
                            </div>
                        </div>
                    )}

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
                                            onClick={() => {
                                                void recordAttendance({ classId, studentId: selectedStudent.email, status: "present", date: Date.now() });
                                            }}
                                            className="px-3 py-1.5 rounded-md border border-emerald-200 text-emerald-700 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-50"
                                        >
                                            Present
                                        </button>
                                        <button
                                            onClick={() => {
                                                void recordAttendance({ classId, studentId: selectedStudent.email, status: "tardy", date: Date.now() });
                                            }}
                                            className="px-3 py-1.5 rounded-md border border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-widest hover:bg-amber-50"
                                        >
                                            Tardy
                                        </button>
                                        <button
                                            onClick={() => {
                                                void recordAttendance({ classId, studentId: selectedStudent.email, status: "absent", date: Date.now() });
                                            }}
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
                                                        onClick={() => {
                                                            void createNudge({
                                                                classId,
                                                                studentId: selectedStudent.email,
                                                                assignmentId: a._id,
                                                                message: `Reminder: ${a.name} was due ${new Date(a.dueDate).toLocaleDateString()}.`,
                                                            });
                                                        }}
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
                                            onClick={() => {
                                                void (async () => {
                                                    if (!note.trim()) return;
                                                    await addInterventionNote({ classId, studentId: selectedStudent.email, note, level: noteLevel });
                                                    setNote("");
                                                })();
                                            }}
                                            className="bg-slate-900 text-white px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all"
                                        >
                                            Add Note
                                        </button>
                                    </div>
                                </div>
                            )}

                            {user.role === "teacher" && (
                                <div className="premium-card p-6 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intervention Tasks</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <input
                                            value={taskAssignee}
                                            onChange={(e) => setTaskAssignee(e.target.value)}
                                            placeholder="Assign to (email)"
                                            className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-700"
                                        />
                                        <input
                                            type="datetime-local"
                                            value={taskDueAt}
                                            onChange={(e) => setTaskDueAt(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-700"
                                        />
                                        <button
                                            onClick={() => {
                                                void (async () => {
                                                    if (!taskAssignee.trim()) return;
                                                    await createInterventionTask({
                                                        classId,
                                                        studentId: selectedStudent.email,
                                                        assignedTo: taskAssignee.trim(),
                                                        dueAt: taskDueAt ? new Date(taskDueAt).getTime() : undefined,
                                                    });
                                                    setTaskAssignee("");
                                                    setTaskDueAt("");
                                                })();
                                            }}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                                        >
                                            Assign Task
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {interventionTasks.length === 0 && (
                                            <p className="text-xs text-slate-400 font-medium">No intervention tasks yet.</p>
                                        )}
                                        {interventionTasks.map((task: any) => (
                                            <div key={task._id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">{task.assignedTo}</p>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                        {task.dueAt ? `Due ${new Date(task.dueAt).toLocaleString()}` : "No deadline"}
                                                    </p>
                                                </div>
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => {
                                                        void updateInterventionTask({ taskId: task._id, status: e.target.value as any });
                                                    }}
                                                    className="px-2 py-1.5 rounded-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600"
                                                >
                                                    <option value="open">Open</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="done">Done</option>
                                                </select>
                                            </div>
                                        ))}
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
                                {user.role === "teacher" && submissions.length > 1 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                                        <select
                                            value={compareLeftId}
                                            onChange={(e) => {
                                                setCompareLeftId(e.target.value);
                                                setCompareRightId("");
                                            }}
                                            className="px-2.5 py-2 rounded-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600"
                                        >
                                            <option value="">Compare: submission A</option>
                                            {comparisonCandidates.map((submission: any) => (
                                                <option key={submission._id} value={submission._id}>
                                                    {submission.studentId}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={compareRightId}
                                            onChange={(e) => setCompareRightId(e.target.value)}
                                            className="px-2.5 py-2 rounded-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600"
                                        >
                                            <option value="">Compare: submission B</option>
                                            {rightCandidates.map((submission: any) => (
                                                <option key={submission._id} value={submission._id}>
                                                    {submission.studentId}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="px-2.5 py-2 rounded-md border border-slate-200 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center justify-center">
                                            {comparedPair ? `${Math.round((comparedPair.score || 0) * 100)}% overlap` : "Select two"}
                                        </div>
                                    </div>
                                )}
                                {user.role === "teacher" && comparedPair?.overlap?.length > 0 && (
                                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700">Shared phrases</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {comparedPair.overlap.map((chunk: string) => (
                                                <span key={chunk} className="px-2 py-0.5 rounded-full border border-amber-200 text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-white">
                                                    {chunk}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {submissions.length === 0 && (
                                    <p className="text-xs text-slate-400 font-medium">No submissions yet.</p>
                                )}
                                {submissions.map((s: any) => (
                                    <div key={s._id} className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-bold text-slate-800">{getAssignmentName(s.assignmentId)}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(s.submittedAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {s.content && (
                                                    <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-white text-[8px] font-bold uppercase tracking-widest text-slate-500">
                                                        Text
                                                    </span>
                                                )}
                                                {s.linkUrl && (
                                                    <span className="px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[8px] font-bold uppercase tracking-widest text-emerald-700">
                                                        Link
                                                    </span>
                                                )}
                                                {s.fileUrl && (
                                                    <span className="px-2 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-[8px] font-bold uppercase tracking-widest text-sky-700">
                                                        File
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {s.linkUrl && (
                                                <button
                                                    onClick={() => window.open(s.linkUrl, "_blank")}
                                                    className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-white"
                                                >
                                                    Open Link
                                                </button>
                                            )}
                                            {s.fileUrl && (
                                                <button
                                                    onClick={() => window.open(s.fileUrl, "_blank")}
                                                    className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-white"
                                                >
                                                    Open File
                                                </button>
                                            )}
                                            {user.role === "teacher" && s.content && (
                                                <button
                                                    onClick={() => setActiveSimilarity({ assignmentId: s.assignmentId, studentId: selectedStudent.email })}
                                                    className="px-3 py-1.5 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-white"
                                                >
                                                    Similarity
                                                </button>
                                            )}
                                        </div>
                                        {s.content && (
                                            <p className="text-xs text-slate-600 whitespace-pre-wrap bg-white rounded-md border border-slate-200 px-3 py-2">
                                                {s.content}
                                            </p>
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
