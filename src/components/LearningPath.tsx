import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Zap, Check } from "lucide-react";

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
        <div className="max-w-2xl mx-auto py-10 space-y-16 relative animate-in fade-in duration-500 text-left">
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
                <div className="text-center py-24 rounded-[3.5rem] bg-slate-50 border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-bold italic">Curriculum is coming soon!</p>
                </div>
            ) : (
                learningPath.map((unit: any, uIdx: number) => {
                    return (
                        <div key={unit._id} className="space-y-8">
                            <div className="p-6 rounded-md bg-white border border-slate-200 shadow-sm relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Unit {uIdx + 1}</p>
                                <h2 className="text-xl font-bold mb-1 text-slate-900 tracking-tight">{unit.title}</h2>
                                <p className="text-slate-500 font-medium leading-relaxed max-w-md text-xs">{unit.description}</p>

                                {user.role === "teacher" && (
                                    <button
                                        onClick={() => setIsAddingLesson(unit._id)}
                                        className="absolute bottom-6 right-6 bg-slate-900 text-white font-bold py-1.5 px-3 rounded-md text-[9px] uppercase tracking-widest shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 border border-slate-800"
                                    >
                                        <Plus className="w-3 h-3" /> Add Lesson
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-10 relative">
                                {/* Path line */}
                                <div className="absolute top-0 bottom-0 w-2 bg-slate-100 rounded-full left-1/2 -translate-x-1/2 z-0" />

                                {unit.lessons.map((lesson: any, idx: number) => {
                                    const isOdd = idx % 2 !== 0;
                                    return (
                                        <div
                                            key={lesson._id}
                                            className={`relative z-10 flex items-center w-full ${isOdd ? "justify-center translate-x-12" : "justify-center -translate-x-12"
                                                }`}
                                        >
                                            <button
                                                onClick={() => handleComplete(lesson._id)}
                                                disabled={lesson.isCompleted}
                                                className={`group relative flex items-center justify-center w-14 h-14 rounded-md border transition-all duration-200 shadow-sm ${lesson.isCompleted
                                                    ? `bg-emerald-600 border-emerald-600 text-white cursor-default`
                                                    : `bg-white border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-600`
                                                    }`}
                                            >
                                                {lesson.isCompleted ? (
                                                    <Check className="w-5 h-5" />
                                                ) : (
                                                    <Zap className="w-5 h-5" />
                                                )}

                                                {/* Tooltip */}
                                                <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[9px] px-2.5 py-1 rounded-md whitespace-nowrap pointer-events-none font-bold uppercase tracking-widest shadow-md">
                                                    {lesson.title} (+{lesson.xpAward} XP)
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
