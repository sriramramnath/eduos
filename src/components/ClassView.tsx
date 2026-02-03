import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { UploadButton } from "./UploadButton";
import { FileGrid } from "./FileGrid";
import { LearningPath } from "./LearningPath";
import { Scoreboard } from "./Scoreboard";
import { ArrowLeft, MessageSquare, FileText, Users, Map, Trophy, Mail, Plus, BookOpen, MoreVertical, Presentation, Camera, Loader2 } from "lucide-react";

interface ClassViewProps {
    classId: Id<"classes">;
    user: any;
    onBack: () => void;
}

export function ClassView({ classId, user, onBack }: ClassViewProps) {
    const [activeTab, setActiveTab] = useState<"stream" | "classwork" | "people" | "path" | "leaderboard">("stream");
    const classData = useQuery(api.myFunctions.getClassById, { classId });

    if (!classData) return <div className="p-10 text-slate-400 font-bold animate-pulse text-center">Loading Class...</div>;

    return (
        <div className="animate-in fade-in duration-500">
            {/* Premium Workspace Header */}
            <nav className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="w-10 h-10 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center text-slate-400 shadow-sm group">
                        <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform" />
                    </button>
                    <div className="flex flex-col text-left">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{classData.name}</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{classData.code}</p>
                    </div>
                </div>

                <div className="p-1.5 bg-slate-100/50 rounded-xl flex items-center gap-1">
                    {(["stream", "classwork", "people", "path", "leaderboard"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pill-tab text-xs flex items-center gap-2 ${activeTab === tab ? "pill-tab-active" : "pill-tab-inactive"
                                }`}
                        >
                            {tab === "stream" && <MessageSquare className="w-3.5 h-3.5" />}
                            {tab === "classwork" && <FileText className="w-3.5 h-3.5" />}
                            {tab === "people" && <Users className="w-3.5 h-3.5" />}
                            {tab === "path" && <Map className="w-3.5 h-3.5" />}
                            {tab === "leaderboard" && <Trophy className="w-3.5 h-3.5" />}
                            <span className="capitalize">{tab}</span>
                        </button>
                    ))}
                </div>
            </nav>

            <main className="text-left">
                {activeTab === "stream" && <StreamView classData={classData} user={user} />}
                {activeTab === "classwork" && <ClassworkView classId={classId} user={user} />}
                {activeTab === "people" && <PeopleView classId={classId} />}
                {activeTab === "path" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><LearningPath classId={classId} user={user} /></div>}
                {activeTab === "leaderboard" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><Scoreboard classId={classId} /></div>}
            </main>
        </div>
    );
}

function StreamView({ classData, user }: { classData: any; user: any }) {
    const entries = useQuery(api.myFunctions.getStreamEntries, { classId: classData._id }) || [];
    const bannerUrl = useQuery(api.myFunctions.getFileUrl, classData.bannerStorageId ? { storageId: classData.bannerStorageId } : "skip");
    const updateBanner = useMutation(api.myFunctions.updateClassBanner);
    const generateUploadUrl = useMutation(api.myFunctions.generateUploadUrl);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);

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
            <div className={`h-56 rounded-2xl p-10 flex flex-col justify-end text-white relative overflow-hidden shadow-xl border border-slate-200/50 ${!bannerUrl ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : ''}`}>
                {bannerUrl && (
                    <img src={bannerUrl} alt="Class Banner" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {!bannerUrl && (
                    <>
                        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pastel-blue via-transparent to-transparent pointer-events-none"></div>
                        <div className="absolute top-4 right-10 opacity-10 transform -rotate-12 scale-[2.5] pointer-events-none text-white">
                            <BookOpen className="w-24 h-24" />
                        </div>
                    </>
                )}

                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                <div className="relative z-10 flex items-end justify-between">
                    <div>
                        <h2 className="text-4xl font-black mb-1 tracking-tight drop-shadow-sm">{classData.name}</h2>
                        <p className="text-pastel-blue font-bold uppercase tracking-[0.25em] text-[10px] opacity-90">{classData.description || "Academic Year 2026"}</p>
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
                                className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border border-white/20 ${isUploadingBanner ? 'opacity-50' : ''}`}
                            >
                                {isUploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                {isUploadingBanner ? "Uploading..." : "Change Banner"}
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Upcoming sidebar */}
                <div className="md:col-span-1 hidden md:block">
                    <div className="p-6 premium-card space-y-5">
                        <h3 className="font-bold text-slate-900 tracking-tight text-sm">Today's Focus</h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-pastel-blue/5 rounded-xl border border-pastel-blue/10">
                                <p className="text-[10px] font-black text-pastel-blue uppercase tracking-widest mb-1">Upcoming</p>
                                <p className="text-sm font-bold text-slate-700 leading-snug">No deadlines yet!</p>
                            </div>
                        </div>
                        <button className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">View All Schedule</button>
                    </div>
                </div>

                {/* Feed */}
                <div className="md:col-span-3 space-y-6">
                    {user.role === "teacher" && (
                        <div className="p-6 premium-card flex items-center gap-6 hover:shadow-lg transition-all">
                            <img
                                src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=111827&color=ffffff&bold=true`}
                                className="w-12 h-12 rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-100"
                                alt={user.name}
                            />
                            <div className="flex-1">
                                <UploadButton classId={classData._id} />
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
                        entries.map((file: any) => (
                            <div key={file._id} className="premium-card p-5 mt-4 flex items-start gap-5 group hover:translate-x-1 transition-all">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                                                {file.uploadedBy.split("@")[0]} shared a resource
                                            </p>
                                            <h4 className="text-lg font-black text-slate-900 group-hover:text-pastel-blue transition-colors cursor-pointer truncate">
                                                {file.name}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                                    {new Date(file._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </p>
                                                {file.isAssignment && (
                                                    <span className="text-[10px] font-black text-pastel-red uppercase tracking-widest bg-pastel-red/5 px-3 py-1 rounded-lg border border-pastel-red/10">Assignment</span>
                                                )}
                                            </div>
                                        </div>
                                        <button className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function ClassworkView({ classId, user }: { classId: Id<"classes">; user: any }) {
    const files = useQuery(api.myFunctions.getClassFiles, { classId }) || [];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Classwork</h2>
                    <p className="text-slate-500 font-medium">Materials and assignments for this course.</p>
                </div>
                {user.role === "teacher" && (
                    <UploadButton classId={classId} isAssignment={true} />
                )}
            </div>

            <FileGrid files={files} userRole={user.role} />
        </div>
    );
}

function PeopleView({ classId }: { classId: Id<"classes"> }) {
    const members = useQuery(api.myFunctions.getClassMembers, { classId }) || [];

    return (
        <div className="max-w-3xl space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Teachers</h2>
                    <button className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-md shadow-slate-900/10 hover:translate-y-[-1px] transition-all">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-6 p-5 premium-card">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Presentation className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-lg font-black text-slate-900">Class Instructor</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</p>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between border-b-2 border-slate-100 pb-6 mb-8">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Students</h2>
                    <span className="px-4 py-2 bg-slate-100 rounded-full text-xs font-black text-slate-500 uppercase tracking-widest">{members.length} Total</span>
                </div>

                <div className="space-y-3">
                    {members.map((member: any) => (
                        <div key={member.email} className="premium-card p-5 flex items-center gap-5 group hover:translate-x-1 transition-all">
                            <img
                                src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f1f5f9&color=64748b&bold=true`}
                                className="w-12 h-12 rounded-xl border border-slate-100 shadow-sm transition-transform group-hover:scale-105"
                                alt={member.name}
                            />
                            <div className="flex-1">
                                <p className="text-base font-black text-slate-800">{member.name}</p>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{member.email}</p>
                            </div>
                            <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center">
                                <Mail className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <div className="text-center py-20 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold text-sm italic">No students have joined yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
