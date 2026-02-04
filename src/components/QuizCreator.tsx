import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Plus, Trash2, CheckCircle2, Circle, Loader2 } from "lucide-react";

interface QuizCreatorProps {
    classId: Id<"classes">;
    onClose: () => void;
    onSuccess: () => void;
}

export function QuizCreator({ classId, onClose, onSuccess }: QuizCreatorProps) {
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState([
        { question: "", options: ["", ""], correctOption: 0 }
    ]);
    const [isCreating, setIsCreating] = useState(false);
    const createQuiz = useMutation(api.myFunctions.createQuiz);

    const addQuestion = () => {
        setQuestions([...questions, { question: "", options: ["", ""], correctOption: 0 }]);
    };

    const removeQuestion = (index: number) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQuestions = [...questions];
        (newQuestions as any)[index][field] = value;
        setQuestions(newQuestions);
    };

    const addOption = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.push("");
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        if (!title.trim() || questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) {
            alert("Please fill in all fields.");
            return;
        }

        setIsCreating(true);
        try {
            await createQuiz({
                classId,
                title,
                questions,
                xpValue: questions.length * 10
            });
            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Interactive Quiz</h2>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Add questions and interactive options for your students.</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Quiz Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Math Challenge"
                            className="w-full bg-slate-50 border border-slate-200 rounded-md p-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-all"
                        />
                    </div>

                    <div className="space-y-6">
                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="p-6 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4 relative group">
                                <button
                                    onClick={() => removeQuestion(qIndex)}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-md bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4 mx-auto" />
                                </button>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Question {qIndex + 1}</label>
                                    <input
                                        value={q.question}
                                        onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                                        placeholder="Type your question here..."
                                        className="w-full bg-white border border-slate-100 rounded-md p-4 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Options (Mark the correct one)</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateQuestion(qIndex, "correctOption", oIndex)}
                                                    className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-all ${q.correctOption === oIndex ? "text-emerald-500 bg-emerald-50" : "text-slate-200"}`}
                                                >
                                                    {q.correctOption === oIndex ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                </button>
                                                <input
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...q.options];
                                                        newOpts[oIndex] = e.target.value;
                                                        updateQuestion(qIndex, "options", newOpts);
                                                    }}
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    className="flex-1 bg-white border border-slate-100 rounded-md px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500/50"
                                                />
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addOption(qIndex)}
                                            className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest pl-9 py-1 hover:underline text-left"
                                        >
                                            + Add Option
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addQuestion}
                            className="w-full py-4 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 font-bold text-[11px] uppercase tracking-widest hover:border-emerald-500/30 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Question
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{questions.length * 10} XP Reward for students</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-md text-slate-400 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-100 transition-all"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isCreating}
                            className="bg-emerald-600 text-white px-8 py-2.5 rounded-md font-bold text-[11px] uppercase tracking-wider shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Quiz"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
