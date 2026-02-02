import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react"; // Added useState import

interface LearningPathProps {
    user: any;
}

export function LearningPath({ user }: LearningPathProps) {
    const learningPath = useQuery(api.myFunctions.getLearningPath) || [];
    const completeLesson = useMutation(api.myFunctions.completeLesson);
    const createUnit = useMutation(api.myFunctions.adminCreateUnit); // Added
    const createLesson = useMutation(api.myFunctions.adminCreateLesson); // Added

    const [isAddingUnit, setIsAddingUnit] = useState(false); // Added
    const [isAddingLesson, setIsAddingLesson] = useState<Id<"units"> | null>(null); // Added
    const [newTitle, setNewTitle] = useState(""); // Added
    const [newDesc, setNewDesc] = useState(""); // Added
    const [newContent, setNewContent] = useState(""); // Added

    const handleComplete = async (lessonId: Id<"lessons">) => {
        try {
            const result = await completeLesson({ lessonId });
            console.log("Lesson completed!", result);
        } catch (error) {
            console.error("Failed to complete lesson:", error);
        }
    };

    const handleAddUnit = async () => { // Added
        if (!newTitle || !newDesc) return;
        await createUnit({ title: newTitle, description: newDesc, order: learningPath.length });
        setIsAddingUnit(false);
        setNewTitle("");
        setNewDesc("");
    };

    const handleAddLesson = async () => { // Added
        if (!newTitle || !newContent || !isAddingLesson) return;
        const unit = learningPath.find(u => u._id === isAddingLesson);
        await createLesson({
            unitId: isAddingLesson,
            title: newTitle,
            content: newContent,
            order: unit?.lessons.length || 0,
            xpAward: 50
        });
        setIsAddingLesson(null);
        setNewTitle("");
        setNewContent("");
    };

    return (
        <div className="max-w-2xl mx-auto py-10 space-y-16 relative">
            {user.role === "teacher" && ( // Added
                <div className="flex justify-end mb-8">
                    <button
                        onClick={() => setIsAddingUnit(true)}
                        className="gradient-bg text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:shadow-xl transition-all"
                    >
                        + ADD NEW UNIT
                    </button>
                </div>
            )}

            {isAddingUnit && ( // Added
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6">
                        <h3 className="text-2xl font-black text-slate-900">Create New Unit</h3>
                        <input
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-brand-primary outline-none transition-all font-medium"
                            placeholder="Unit Title (e.g. Basics of Algebra)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-brand-primary outline-none transition-all font-medium h-32"
                            placeholder="Unit Description"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsAddingUnit(false)}
                                className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddUnit}
                                className="flex-1 gradient-bg text-white py-4 rounded-xl font-black shadow-lg"
                            >
                                CREATE UNIT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddingLesson && ( // Added
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6">
                        <h3 className="text-2xl font-black text-slate-900">Add Lesson</h3>
                        <input
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-brand-primary outline-none transition-all font-medium"
                            placeholder="Lesson Title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-brand-primary outline-none transition-all font-medium h-32"
                            placeholder="Lesson Content/Instructions"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsAddingLesson(null)}
                                className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddLesson}
                                className="flex-1 gradient-bg text-white py-4 rounded-xl font-black shadow-lg"
                            >
                                ADD LESSON
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {learningPath.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-slate-400 font-medium italic">No learning content added yet.</p>
                </div>
            ) : (
                learningPath.map((unit) => (
                    <div key={unit._id} className="space-y-8">
                        <div className="gradient-bg p-8 rounded-3xl text-white shadow-xl shadow-brand-primary/20 relative group">
                            <h2 className="text-2xl font-bold mb-2">{unit.title}</h2>
                            <p className="text-white/80 font-medium">{unit.description}</p>

                            {user.role === "teacher" && ( // Added
                                <button
                                    onClick={() => setIsAddingLesson(unit._id)}
                                    className="absolute -bottom-4 right-8 bg-white text-brand-primary py-2 px-4 rounded-xl text-xs font-black shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                                >
                                    + ADD LESSON
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-6 relative">
                            {/* Path line */}
                            <div className="absolute top-0 bottom-0 w-1.5 bg-slate-200 rounded-full left-1/2 -translate-x-1/2 z-0" />

                            {unit.lessons.map((lesson, idx) => {
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
                                            className={`group relative flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-300 transform hover:scale-110 active:scale-95 ${lesson.isCompleted
                                                ? "bg-brand-secondary border-brand-secondary text-white cursor-default"
                                                : "bg-white border-slate-200 text-slate-400 hover:border-brand-primary hover:text-brand-primary shadow-lg shadow-slate-200"
                                                }`}
                                        >
                                            {lesson.isCompleted ? (
                                                <span className="text-2xl">✔</span>
                                            ) : (
                                                <span className="text-2xl">✨</span>
                                            )}

                                            {/* Tooltip */}
                                            <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none font-bold">
                                                {lesson.title} (+{lesson.xpAward} XP)
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
