import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Plus, Trash2, CheckCircle2, Circle, Loader2, Clock, Calendar, Zap, Eye, Lock } from "lucide-react";

interface QuizCreatorProps {
    classId: Id<"classes">;
    onClose: () => void;
    onSuccess: () => void;
}

export function QuizCreator({ classId, onClose, onSuccess }: QuizCreatorProps) {
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState([
        { question: "", options: ["", ""], correctOption: 0, questionType: "mcq", correctAnswerText: "", correctNumber: undefined, explanation: "" }
    ]);
    const [isCreating, setIsCreating] = useState(false);
    const createQuiz = useMutation((api as any).featureFunctions.createAdvancedQuiz);

    const addQuestion = () => {
        setQuestions([...questions, { question: "", options: ["", ""], correctOption: 0, questionType: "mcq", correctAnswerText: "", correctNumber: undefined, explanation: "" }]);
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

    // New configuration states
    const [xpMode, setXpMode] = useState<"overall" | "perQuestion">("overall");
    const [xpPerQuestion, setXpPerQuestion] = useState(10);
    const [overallXp, setOverallXp] = useState(questions.length * 10);
    const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | undefined>(undefined);
    const [enableTimer, setEnableTimer] = useState(false);
    const [gradesPublic, setGradesPublic] = useState(true);
    const [singleAttempt, setSingleAttempt] = useState(true);
    const [dueDate, setDueDate] = useState<string>("");
    const [randomizeQuestions, setRandomizeQuestions] = useState(false);
    const [randomizeOptions, setRandomizeOptions] = useState(false);
    const [maxAttempts, setMaxAttempts] = useState<number | undefined>(1);
    const [showExplanations, setShowExplanations] = useState(true);

    const handleSubmit = async () => {
        if (!title.trim() || questions.some(q => !q.question.trim())) {
            alert("Please fill in all fields.");
            return;
        }

        const normalizedQuestions = questions.map((question: any) => {
            if (question.questionType === "true_false") {
                return {
                    ...question,
                    options: ["True", "False"],
                    correctOption: Math.min(Math.max(question.correctOption || 0, 0), 1),
                };
            }
            if (question.questionType === "mcq") {
                if (question.options.some((option: string) => !option.trim())) {
                    throw new Error("Fill all options for multiple-choice questions.");
                }
            }
            if (question.questionType === "short" && !String(question.correctAnswerText || "").trim()) {
                throw new Error("Provide a correct short answer.");
            }
            if (question.questionType === "numeric" && !Number.isFinite(Number(question.correctNumber))) {
                throw new Error("Provide a valid numeric answer.");
            }
            return question;
        });

        setIsCreating(true);
        try {
            await createQuiz({
                classId,
                title,
                questions: normalizedQuestions,
                xpValue: xpMode === "overall" ? overallXp : questions.length * xpPerQuestion,
                xpPerQuestion: xpMode === "perQuestion" ? xpPerQuestion : undefined,
                timeLimitMinutes: enableTimer ? timeLimitMinutes : undefined,
                gradesPublic,
                singleAttempt,
                dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
                randomizeQuestions,
                randomizeOptions,
                maxAttempts: singleAttempt ? 1 : maxAttempts,
                showExplanations,
            });
            onSuccess();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Failed to create quiz");
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
                                    <select
                                        value={q.questionType || "mcq"}
                                        onChange={(e) => {
                                            const nextType = e.target.value;
                                            if (nextType === "true_false") {
                                                updateQuestion(qIndex, "options", ["True", "False"]);
                                                updateQuestion(qIndex, "correctOption", 0);
                                            }
                                            updateQuestion(qIndex, "questionType", nextType);
                                        }}
                                        className="w-full bg-white border border-slate-100 rounded-md px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500/50"
                                    >
                                        <option value="mcq">Multiple Choice</option>
                                        <option value="true_false">True / False</option>
                                        <option value="short">Short Answer</option>
                                        <option value="numeric">Numeric</option>
                                    </select>
                                </div>

                                {(q.questionType === "mcq" || q.questionType === "true_false" || !q.questionType) && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Options (Mark the correct one)</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {q.options.map((opt: string, oIndex: number) => (
                                                <div key={oIndex} className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => updateQuestion(qIndex, "correctOption", oIndex)}
                                                        className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-all ${q.correctOption === oIndex ? "text-emerald-500 bg-emerald-50" : "text-slate-200"}`}
                                                    >
                                                        {q.correctOption === oIndex ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                    </button>
                                                    <input
                                                        value={opt}
                                                        disabled={q.questionType === "true_false"}
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
                                            {q.questionType !== "true_false" && (
                                                <button
                                                    onClick={() => addOption(qIndex)}
                                                    className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest pl-9 py-1 hover:underline text-left"
                                                >
                                                    + Add Option
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {q.questionType === "short" && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Correct Answer</label>
                                        <input
                                            value={q.correctAnswerText || ""}
                                            onChange={(e) => updateQuestion(qIndex, "correctAnswerText", e.target.value)}
                                            placeholder="Expected short answer"
                                            className="w-full bg-white border border-slate-100 rounded-md px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                )}

                                {q.questionType === "numeric" && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Correct Number</label>
                                        <input
                                            type="number"
                                            value={q.correctNumber ?? ""}
                                            onChange={(e) => updateQuestion(qIndex, "correctNumber", Number(e.target.value))}
                                            placeholder="Expected numeric answer"
                                            className="w-full bg-white border border-slate-100 rounded-md px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                )}
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

                    {/* New Configuration Panel */}
                    <div className="p-5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-5">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Quiz Settings
                        </h3>

                        {/* XP Configuration */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">XP Award Mode</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setXpMode("overall")}
                                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${xpMode === "overall" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
                                >
                                    Overall XP
                                </button>
                                <button
                                    onClick={() => setXpMode("perQuestion")}
                                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${xpMode === "perQuestion" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
                                >
                                    Per Question
                                </button>
                            </div>
                            {xpMode === "overall" ? (
                                <input
                                    type="number"
                                    value={overallXp}
                                    onChange={(e) => setOverallXp(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500/50"
                                    placeholder="Total XP for quiz"
                                />
                            ) : (
                                <input
                                    type="number"
                                    value={xpPerQuestion}
                                    onChange={(e) => setXpPerQuestion(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500/50"
                                    placeholder="XP per correct answer"
                                />
                            )}
                        </div>

                        {/* Timer Configuration */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700">Enable Timer</span>
                            </div>
                            <button
                                onClick={() => setEnableTimer(!enableTimer)}
                                className={`w-10 h-5 rounded-full transition-all relative ${enableTimer ? "bg-emerald-500" : "bg-slate-200"}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${enableTimer ? "left-5" : "left-0.5"}`}></div>
                            </button>
                        </div>
                        {enableTimer && (
                            <input
                                type="number"
                                value={timeLimitMinutes || ""}
                                onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || undefined)}
                                placeholder="Time limit in minutes"
                                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500/50"
                            />
                        )}

                        {/* Grade Visibility */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700">Public Grades</span>
                            </div>
                            <button
                                onClick={() => setGradesPublic(!gradesPublic)}
                                className={`w-10 h-5 rounded-full transition-all relative ${gradesPublic ? "bg-emerald-500" : "bg-slate-200"}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${gradesPublic ? "left-5" : "left-0.5"}`}></div>
                            </button>
                        </div>

                        {/* Single Attempt */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700">Single Attempt Only</span>
                            </div>
                            <button
                                onClick={() => setSingleAttempt(!singleAttempt)}
                                className={`w-10 h-5 rounded-full transition-all relative ${singleAttempt ? "bg-emerald-500" : "bg-slate-200"}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${singleAttempt ? "left-5" : "left-0.5"}`}></div>
                            </button>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Due Date (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700">Randomize Questions</span>
                            </div>
                            <button
                                onClick={() => setRandomizeQuestions(!randomizeQuestions)}
                                className={`w-10 h-5 rounded-full transition-all relative ${randomizeQuestions ? "bg-emerald-500" : "bg-slate-200"}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${randomizeQuestions ? "left-5" : "left-0.5"}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700">Randomize Options</span>
                            </div>
                            <button
                                onClick={() => setRandomizeOptions(!randomizeOptions)}
                                className={`w-10 h-5 rounded-full transition-all relative ${randomizeOptions ? "bg-emerald-500" : "bg-slate-200"}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${randomizeOptions ? "left-5" : "left-0.5"}`}></div>
                            </button>
                        </div>

                        {!singleAttempt && (
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max Attempts</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={maxAttempts || 1}
                                    onChange={(e) => setMaxAttempts(Math.max(1, Number(e.target.value) || 1))}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-700">Show Explanations</span>
                            </div>
                            <button
                                onClick={() => setShowExplanations(!showExplanations)}
                                className={`w-10 h-5 rounded-full transition-all relative ${showExplanations ? "bg-emerald-500" : "bg-slate-200"}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showExplanations ? "left-5" : "left-0.5"}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {xpMode === "overall" ? overallXp : questions.length * xpPerQuestion} XP Reward for students
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-md text-slate-400 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-100 transition-all"
                        >
                            Discard
                        </button>
                        <button
                            onClick={() => {
                                void handleSubmit();
                            }}
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
