import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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
                        className="bg-brand-primary text-white px-8 py-4 rounded-3xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all text-sm tracking-widest uppercase"
                    >
                        ✨ New Learning Unit
                    </button>
                </div>
            )}

            {isAddingUnit && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight text-center">New Unit</h3>
                        <input
                            className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                            placeholder="Unit Title (e.g. Intro to Algebra)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none transition-all font-medium text-slate-600 h-32 placeholder:text-slate-300"
                            placeholder="Brief Overview"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsAddingUnit(false)}
                                className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddUnit}
                                className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-black shadow-xl"
                            >
                                CREATE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddingLesson && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight text-center">New Lesson</h3>
                        <input
                            className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                            placeholder="Lesson Title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none transition-all font-medium text-slate-600 h-32 placeholder:text-slate-300"
                            placeholder="Content or Prompt"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsAddingLesson(null)}
                                className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddLesson}
                                className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-black shadow-xl"
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
                        <div key={unit._id} className="space-y-12">
                            <div className={`p-10 rounded-[2.5rem] text-white shadow-2xl relative group overflow-hidden ${color}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">Learning Unit {uIdx + 1}</p>
                                <h2 className="text-3xl font-black mb-3 tracking-tight">{unit.title}</h2>
                                <p className="text-white/80 font-medium leading-relaxed max-w-md">{unit.description}</p>

                                {user.role === "teacher" && (
                                    <button
                                        onClick={() => setIsAddingLesson(unit._id)}
                                        className="absolute bottom-10 right-10 bg-white text-slate-900 font-black py-2.5 px-6 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                                    >
                                        + ADD LESSON
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
                                                className={`group relative flex items-center justify-center w-20 h-20 rounded-[2rem] border-4 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-xl ${lesson.isCompleted
                                                    ? `bg-slate-900 border-slate-900 text-white cursor-default`
                                                    : `bg-white border-slate-100 text-slate-400 hover:border-${color.replace('bg-', '')} hover:text-${color.replace('bg-', '')}`
                                                    }`}
                                            >
                                                {lesson.isCompleted ? (
                                                    <span className="text-3xl">✔</span>
                                                ) : (
                                                    <span className="text-3xl">⚡</span>
                                                )}

                                                {/* Tooltip */}
                                                <div className="absolute left-full ml-6 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] px-4 py-2 rounded-2xl whitespace-nowrap pointer-events-none font-black uppercase tracking-widest shadow-2xl transform translate-x-2 group-hover:translate-x-0">
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
