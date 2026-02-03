import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Zap, Check, Sparkles } from "lucide-react";

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
        <div className="max-w-2xl mx-auto py-12 space-y-20 relative animate-in fade-in duration-700">
            {user.role === "teacher" && (
                <div className="flex justify-end mb-12">
                    <button
                        onClick={() => setIsAddingUnit(true)}
                        className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-brand-primary/10 hover:-translate-y-0.5 transition-all text-xs tracking-widest uppercase flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Learning Unit
                    </button>
                </div>
            )}
            {isAddingUnit && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight text-center flex items-center justify-center gap-2">
                            <Plus className="w-6 h-6 text-brand-primary" /> New Unit
                        </h3>
                        <input
                            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                            placeholder="Unit Title (e.g. Intro to Algebra)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none transition-all font-medium text-slate-600 h-28 placeholder:text-slate-300 resize-none"
                            placeholder="Brief Overview"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsAddingUnit(false)}
                                className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors text-sm"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddUnit}
                                className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-bold shadow-md shadow-brand-primary/10 hover:-translate-y-0.5 transition-all text-sm"
                            >
                                CREATE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddingLesson && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight text-center flex items-center justify-center gap-2">
                            <Sparkles className="w-6 h-6 text-brand-primary" /> New Lesson
                        </h3>
                        <input
                            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                            placeholder="Lesson Title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none transition-all font-medium text-slate-600 h-28 placeholder:text-slate-300 resize-none"
                            placeholder="Content or Prompt"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsAddingLesson(null)}
                                className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors text-sm"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddLesson}
                                className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-bold shadow-md shadow-brand-primary/10 hover:-translate-y-0.5 transition-all text-sm"
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
                    const colors = ['bg-pastel-blue', 'bg-pastel-purple', 'bg-pastel-green'];
                    const color = colors[uIdx % colors.length];

                    return (
                        <div key={unit._id} className="space-y-10">
                            <div className={`p-8 rounded-2xl text-white shadow-xl relative group overflow-hidden ${color}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-70 mb-1">Learning Unit {uIdx + 1}</p>
                                <h2 className="text-2xl font-black mb-2 tracking-tight">{unit.title}</h2>
                                <p className="text-white/80 font-medium leading-relaxed max-w-md text-sm">{unit.description}</p>

                                {user.role === "teacher" && (
                                    <button
                                        onClick={() => setIsAddingLesson(unit._id)}
                                        className="absolute bottom-8 right-8 bg-white text-slate-900 font-bold py-2.5 px-5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-2"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> ADD LESSON
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
                                            className={`relative z-10 flex items-center w-full ${isOdd ? "justify-center translate-x-16" : "justify-center -translate-x-16"
                                                }`}
                                        >
                                            <button
                                                onClick={() => handleComplete(lesson._id)}
                                                disabled={lesson.isCompleted}
                                                className={`group relative flex items-center justify-center w-16 h-16 rounded-xl border-2 transition-all duration-200 shadow-lg ${lesson.isCompleted
                                                    ? `bg-slate-900 border-slate-900 text-white cursor-default`
                                                    : `bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600`
                                                    }`}
                                            >
                                                {lesson.isCompleted ? (
                                                    <Check className="w-6 h-6" />
                                                ) : (
                                                    <Zap className="w-6 h-6" />
                                                )}

                                                {/* Tooltip */}
                                                <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none font-bold uppercase tracking-widest shadow-xl transform translate-x-2 group-hover:translate-x-0">
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
