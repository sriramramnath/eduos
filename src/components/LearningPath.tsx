import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Zap, Check, BookOpen, ClipboardCheck, Dumbbell } from "lucide-react";
import { BookMascot } from "./BookMascot";

interface LearningPathProps {
    classId: Id<"classes">;
    user: any;
}

export function LearningPath({ classId, user }: LearningPathProps) {
    const learningPath = useQuery(api.myFunctions.getLearningPath, { classId }) || [];
    const completeLesson = useMutation(api.myFunctions.completeLesson);
    const createUnit = useMutation(api.myFunctions.adminCreateUnit);
    const createLesson = useMutation(api.myFunctions.adminCreateLesson);

    const [isAddingUnit, setIsAddingUnit] = useState(false);
    const [isAddingLesson, setIsAddingLesson] = useState<Id<"units"> | null>(null);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newContent, setNewContent] = useState("");
    const mascotName = "Pagey";
    const [selectedLesson, setSelectedLesson] = useState<any>(null);

    const handleAddUnit = async () => {
        if (!newTitle) return;
        await createUnit({ classId, title: newTitle, description: newDesc, order: learningPath.length });
        setIsAddingUnit(false);
        setNewTitle("");
        setNewDesc("");
    };

    const handleAddLesson = async () => {
        if (!newTitle || !newContent || !isAddingLesson) return;
        const unit = learningPath.find((u: any) => u._id === isAddingLesson);
        const lessonOrder = unit ? (unit.lessons?.length || 0) : 0;
        await createLesson({
            unitId: isAddingLesson,
            title: newTitle,
            content: newContent,
            xpAward: 10,
            order: lessonOrder,
        });
        setIsAddingLesson(null);
        setNewTitle("");
        setNewContent("");
    };

    const handleComplete = async (lessonId: Id<"lessons">) => {
        await completeLesson({ lessonId });
    };

    return (
        <div className="max-w-3xl mx-auto py-10 space-y-16 relative animate-in fade-in duration-500 text-left">
            {user.role === "teacher" && (
                <div className="flex justify-end mb-8">
                    <button
                        onClick={() => setIsAddingUnit(true)}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[10px] tracking-widest uppercase flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Unit
                    </button>
                </div>
            )}
            {isAddingUnit && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-md p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight text-center">New Unit</h3>
                        <input
                            className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-sm placeholder:text-slate-300"
                            placeholder="Unit Title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-slate-600 text-sm h-24 placeholder:text-slate-300 resize-none"
                            placeholder="Overview"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAddingUnit(false)}
                                className="flex-1 py-2.5 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-widest"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddUnit}
                                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-widest"
                            >
                                CREATE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddingLesson && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-md p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight text-center">New Lesson</h3>
                        <input
                            className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-sm placeholder:text-slate-300"
                            placeholder="Lesson Title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-slate-600 text-sm h-24 placeholder:text-slate-300 resize-none"
                            placeholder="Content"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAddingLesson(null)}
                                className="flex-1 py-2.5 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-widest"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddLesson}
                                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-widest"
                            >
                                ADD
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {learningPath.length === 0 ? (
                <div className="text-center py-20 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 space-y-4">
                    <div className="flex justify-center">
                        <BookMascot mood="sleepy" size={120} label={`${mascotName} waiting for lessons`} />
                    </div>
                    <p className="text-slate-500 font-bold">Curriculum is coming soon!</p>
                    <p className="text-xs text-slate-400 font-medium">Ask a teacher to add units and lessons to wake {mascotName} up.</p>
                </div>
            ) : (
                learningPath.map((unit: any, uIdx: number) => {
                    const lessons = unit.lessons || [];
                    const firstIncompleteIndex = lessons.findIndex((lesson: any) => !lesson.isCompleted);
                    return (
                        <div key={unit._id} className="space-y-10">
                            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Unit {uIdx + 1}</p>
                                        <h2 className="text-xl font-bold mb-1 text-slate-900 tracking-tight">{unit.title}</h2>
                                        <p className="text-slate-500 font-medium leading-relaxed max-w-md text-xs">{unit.description}</p>
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {lessons.length} lessons
                                    </div>
                                </div>

                                {user.role === "teacher" && (
                                    <button
                                        onClick={() => setIsAddingLesson(unit._id)}
                                        className="absolute bottom-6 right-6 bg-slate-900 text-white font-bold py-1.5 px-3 rounded-md text-[9px] uppercase tracking-widest shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 border border-slate-800"
                                    >
                                        <Plus className="w-3 h-3" /> Add Lesson
                                    </button>
                                )}
                            </div>

                            <div className="relative flex flex-col items-center gap-12 py-6">
                                <div className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 bg-gradient-to-b from-emerald-200 via-emerald-100 to-slate-100 rounded-full" />
                                <div className="absolute inset-y-0 left-1/2 w-28 -translate-x-1/2 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.12),_rgba(255,255,255,0))] opacity-70" />

                                {lessons.map((lesson: any, idx: number) => {
                                    const isOdd = idx % 2 !== 0;
                                    const offsetClass = isOdd ? "translate-x-14 md:translate-x-24" : "-translate-x-14 md:-translate-x-24";
                                    const nodeType = idx % 3 === 0 ? "practice" : idx % 3 === 1 ? "learn" : "quiz";
                                    const isCompleted = !!lesson.isCompleted;
                                    const isCurrent = firstIncompleteIndex === idx;
                                    const isLocked = firstIncompleteIndex !== -1 && idx > firstIncompleteIndex;
                                    const NodeIcon = nodeType === "quiz" ? ClipboardCheck : nodeType === "practice" ? Dumbbell : BookOpen;
                                    return (
                                        <div
                                            key={lesson._id}
                                            className={`relative z-10 flex items-center w-full justify-center ${offsetClass}`}
                                        >
                                            <div className="relative flex flex-col items-center gap-3">
                                                {isCurrent && (
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-emerald-600 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                                                        Start
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setSelectedLesson({ ...lesson, isCompleted, isLocked, nodeType })}
                                                    disabled={isLocked}
                                                    className={`group relative flex items-center justify-center w-20 h-20 rounded-full border-[3px] transition-all duration-200 shadow-[0_8px_18px_rgba(16,185,129,0.18)] ${isCompleted
                                                        ? `bg-emerald-500 border-emerald-500 text-white cursor-default`
                                                        : isLocked
                                                            ? `bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed`
                                                            : `bg-white border-emerald-300 text-emerald-600 hover:border-emerald-500 hover:text-emerald-700`
                                                        }`}
                                                >
                                                    {isCompleted ? (
                                                        <Check className="w-7 h-7" />
                                                    ) : (
                                                        <NodeIcon className="w-7 h-7" />
                                                    )}

                                                    <div className={`absolute -bottom-3 w-12 h-3 rounded-full blur-sm opacity-60 ${isCompleted ? "bg-emerald-200" : "bg-slate-200"}`}></div>
                                                </button>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{lesson.title}</p>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <p className="text-[9px] text-emerald-600 font-bold">+{lesson.xpAward} XP</p>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isLocked ? "text-slate-300" : "text-slate-400"}`}>
                                                            {nodeType}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}
            {selectedLesson && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-emerald-600 p-6 flex items-center justify-between text-white">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{selectedLesson.nodeType}</p>
                                <h3 className="font-bold tracking-tight text-lg">{selectedLesson.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        window.speechSynthesis.cancel();
                                        setSelectedLesson(null);
                                    }}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                                >
                                    X
                                </button>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedLesson.content}</div>
                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">+{selectedLesson.xpAward} XP</div>
                                {user.role === "student" && (
                                    <button
                                        disabled={selectedLesson.isCompleted}
                                        onClick={async () => {
                                            await handleComplete(selectedLesson._id);
                                            setSelectedLesson(null);
                                        }}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                                    >
                                        {selectedLesson.isCompleted ? "Completed" : "Mark Complete"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
