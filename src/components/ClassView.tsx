import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { UploadButton } from "./UploadButton";
import { FileGrid } from "./FileGrid";
import { LearningPath } from "./LearningPath";
import { Scoreboard } from "./Scoreboard";

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
            <nav className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center text-slate-400 shadow-sm">
                        <span className="text-xl">↖</span>
                    </button>
                    <div className="flex flex-col text-left">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{classData.name}</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{classData.code}</p>
                    </div>
                </div>

                <div className="p-1.5 bg-slate-100/50 rounded-full flex items-center gap-1">
                    {(["stream", "classwork", "people", "path", "leaderboard"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pill-tab text-xs ${activeTab === tab ? "pill-tab-active" : "pill-tab-inactive"
                                }`}
                        >
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Banner */}
            <div className="h-56 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 p-12 flex flex-col justify-end text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pastel-blue via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute top-4 right-10 opacity-20 transform -rotate-12 scale-[2] pointer-events-none">
                    <span className="text-9xl">📚</span>
                </div>
                <h2 className="text-5xl font-black mb-2 tracking-tight">{classData.name}</h2>
                <p className="text-pastel-blue font-black uppercase tracking-[0.3em] text-xs italic">{classData.description || "Academic Year 2026"}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Upcoming sidebar */}
                <div className="md:col-span-1 hidden md:block">
                    <div className="p-8 premium-card space-y-6">
                        <h3 className="font-black text-slate-900 tracking-tight">Today's Focus</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-pastel-blue/10 rounded-2xl border border-pastel-blue/20">
                                <p className="text-xs font-black text-pastel-blue uppercase tracking-widest mb-1">Upcoming</p>
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
                        <div className="text-center py-24 rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-100">
                            <div className="text-5xl mb-4">🎈</div>
                            <p className="text-slate-400 font-bold italic">The stream is empty. Start the conversation!</p>
                        </div>
                    ) : (
                        entries.map((file: any) => (
                            <div key={file._id} className="premium-card p-6 flex items-start gap-6 group hover:translate-x-1 transition-all">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-100 group-hover:bg-pastel-blue group-hover:text-white transition-colors">
                                    <span>📄</span>
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
                                                    <span className="text-[10px] font-black text-pastel-red uppercase tracking-widest bg-pastel-red/10 px-3 py-1 rounded-full border border-pastel-red/20">Assignment</span>
                                                )}
                                            </div>
                                        </div>
                                        <button className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors">⋮</button>
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
                <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6 mb-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Teachers</h2>
                    <button className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-lg shadow-slate-900/20 hover:scale-105 transition-all">➕</button>
                </div>
                <div className="flex items-center gap-6 p-6 premium-card">
                    <div className="w-16 h-16 rounded-2xl bg-pastel-blue/10 flex items-center justify-center text-3xl shadow-inner border border-pastel-blue/20">👨‍🏫</div>
                    <div>
                        <p className="text-xl font-black text-slate-900">Class Instructor</p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Administrator</p>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between border-b-2 border-slate-100 pb-6 mb-8">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Students</h2>
                    <span className="px-4 py-2 bg-slate-100 rounded-full text-xs font-black text-slate-500 uppercase tracking-widest">{members.length} Total</span>
                </div>

                <div className="space-y-4">
                    {members.map((member: any) => (
                        <div key={member.email} className="premium-card p-6 flex items-center gap-6 group hover:translate-x-1 transition-all">
                            <img
                                src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f1f5f9&color=64748b&bold=true`}
                                className="w-14 h-14 rounded-2xl border border-slate-100 shadow-sm transition-transform group-hover:scale-110"
                                alt={member.name}
                            />
                            <div className="flex-1">
                                <p className="text-lg font-black text-slate-800">{member.name}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.email}</p>
                            </div>
                            <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-pastel-blue hover:text-white transition-all flex items-center justify-center text-xl">📩</button>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <div className="text-center py-24 rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-100">
                            <p className="text-slate-400 font-bold italic">No students have joined yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
