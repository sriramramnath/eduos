import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardCheck,
  Trash2,
  Flame,
  Lock,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { BookMascot } from "./BookMascot";

interface LearningPathProps {
  classId: Id<"classes">;
  user: any;
}

type TaskQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

type TaskFlashcard = {
  front: string;
  back: string;
};

type TaskStage = "pretext" | "data" | "flashcards" | "quiz" | "complete";

const MAX_OPTIONS = 6;

export function LearningPath({ classId, user }: LearningPathProps) {
  const learningPath = useQuery(api.myFunctions.getLearningPath, { classId }) || [];
  const completeLesson = useMutation(api.myFunctions.completeLesson);
  const createLesson = useMutation(api.myFunctions.adminCreateLesson);
  const clearLearningPath = useMutation(api.myFunctions.adminClearLearningPath);
  const deleteLesson = useMutation(api.myFunctions.adminDeleteLesson);

  const [isAddingTask, setIsAddingTask] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskPretext, setTaskPretext] = useState("");
  const [taskData, setTaskData] = useState("");
  const [taskXp, setTaskXp] = useState(20);
  const [taskQuestions, setTaskQuestions] = useState<TaskQuestion[]>([]);
  const [taskFlashcards, setTaskFlashcards] = useState<TaskFlashcard[]>([]);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskStage, setTaskStage] = useState<TaskStage>("pretext");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const mascotName = "Pagey";

  const totalTasks = learningPath.length;
  const completedTasks = learningPath.filter((task: any) => task.isCompleted).length;
  const totalXp = learningPath.reduce((sum: number, task: any) => sum + (task.xpAward || 0), 0);
  const nextTaskSummary = learningPath.find((task: any) => !task.isCompleted);

  const stageSequence = useMemo<TaskStage[]>(() => {
    if (!selectedTask) return [];
    const sequence: TaskStage[] = [];
    const pretext = (selectedTask.pretext || selectedTask.content || "").trim();
    const dataContext = (selectedTask.dataContext || "").trim();
    if (pretext) sequence.push("pretext");
    if (dataContext) sequence.push("data");
    if ((selectedTask.flashcards || []).length) sequence.push("flashcards");
    if ((selectedTask.questions || []).length) sequence.push("quiz");
    sequence.push("complete");
    return sequence.length ? sequence : ["complete"];
  }, [selectedTask]);

  useEffect(() => {
    if (!selectedTask) return;
    setTaskStage(stageSequence[0] || "complete");
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
    setQuestionIndex(0);
    setSelectedOptionIndex(null);
    setShowAnswer(false);
    setCorrectAnswers(0);
  }, [selectedTask?._id, stageSequence]);

  const normalizeQuestions = (questions: TaskQuestion[]) =>
    questions
      .map((q) => {
        const prompt = q.prompt.trim();
        const options = q.options.map((opt) => opt.trim()).filter(Boolean);
        if (!prompt || options.length < 2) return null;
        const correctIndex = Math.min(Math.max(q.correctIndex, 0), options.length - 1);
        return {
          prompt,
          options,
          correctIndex,
          explanation: q.explanation?.trim() || undefined,
        };
      })
      .filter((q): q is TaskQuestion => q !== null);

  const normalizeFlashcards = (cards: TaskFlashcard[]) =>
    cards
      .map((card) => ({ front: card.front.trim(), back: card.back.trim() }))
      .filter((card) => card.front.length && card.back.length);

  const handleAddTask = async () => {
    const trimmedTitle = taskTitle.trim();
    const trimmedPretext = taskPretext.trim();
    const trimmedData = taskData.trim();
    if (!trimmedTitle || (!trimmedPretext && !trimmedData) || !isAddingTask) return;
    const taskOrder = learningPath.length;
    await createLesson({
      classId,
      title: trimmedTitle,
      content: trimmedPretext,
      pretext: trimmedPretext || undefined,
      dataContext: trimmedData || undefined,
      xpAward: Number.isFinite(taskXp) ? taskXp : 10,
      order: taskOrder,
      questions: normalizeQuestions(taskQuestions),
      flashcards: normalizeFlashcards(taskFlashcards),
    });
    setIsAddingTask(false);
    setTaskTitle("");
    setTaskPretext("");
    setTaskData("");
    setTaskXp(20);
    setTaskQuestions([]);
    setTaskFlashcards([]);
  };

  const handleComplete = async (lessonId: Id<"lessons">) => {
    await completeLesson({ lessonId });
  };

  const handleDeleteTask = async (lessonId: Id<"lessons">) => {
    if (!window.confirm("Delete this task and its progress?")) return;
    await deleteLesson({ lessonId });
  };

  const openTask = (task: any, isLocked: boolean) => {
    if (isLocked) return;
    setSelectedTask({
      ...task,
      pretext: task.pretext || task.content || "",
      dataContext: task.dataContext || "",
      questions: task.questions || [],
      flashcards: task.flashcards || [],
    });
  };

  const stageIndex = stageSequence.indexOf(taskStage);
  const stageProgress = stageSequence.length ? ((stageIndex + 1) / stageSequence.length) * 100 : 0;

  const activeFlashcard = selectedTask?.flashcards?.[flashcardIndex];
  const activeQuestion = selectedTask?.questions?.[questionIndex];

  const advanceStage = () => {
    if (!stageSequence.length) return;
    const nextIndex = Math.min(stageIndex + 1, stageSequence.length - 1);
    setTaskStage(stageSequence[nextIndex]);
  };

  const handleFlashcardNext = () => {
    const cards = selectedTask?.flashcards || [];
    if (flashcardIndex < cards.length - 1) {
      setFlashcardIndex((prev) => prev + 1);
      setFlashcardFlipped(false);
      return;
    }
    advanceStage();
  };

  const handleFlashcardPrev = () => {
    if (flashcardIndex === 0) return;
    setFlashcardIndex((prev) => prev - 1);
    setFlashcardFlipped(false);
  };

  const handleCheckAnswer = () => {
    if (!activeQuestion || selectedOptionIndex === null || showAnswer) return;
    if (selectedOptionIndex === activeQuestion.correctIndex) {
      setCorrectAnswers((prev) => prev + 1);
    }
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    const totalQuestions = selectedTask?.questions?.length || 0;
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setShowAnswer(false);
      return;
    }
    advanceStage();
  };

  const isTaskReady =
    taskTitle.trim().length > 0 && (taskPretext.trim().length > 0 || taskData.trim().length > 0);
  const firstIncompleteIndex = learningPath.findIndex((task: any) => !task.isCompleted);
  const overallProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="relative max-w-6xl mx-auto py-10 space-y-12 text-left">
      {user.role === "teacher" && (
        <div className="flex justify-end gap-2">
          <button
            onClick={async () => {
              if (!window.confirm("Delete all tasks and progress for this class?")) return;
              await clearLearningPath({ classId });
            }}
            className="bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-black shadow-sm hover:bg-slate-200 transition-all text-[11px] tracking-[0.2em] uppercase"
          >
            Clear Tasks
          </button>
          <button
            onClick={() => setIsAddingTask(true)}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black shadow-sm hover:bg-emerald-700 transition-all text-[11px] tracking-[0.2em] uppercase flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      )}

      {isAddingTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Task</h3>
                <p className="text-xs text-slate-500 font-medium">Pretext, data briefs, flashcards, quizzes — your call.</p>
              </div>
              <div className="flex items-center gap-2">
                <BookMascot mood="curious" size={70} label={`${mascotName} idea`} />
                <div className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-widest">
                  Task Builder
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Task Title</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-sm placeholder:text-slate-300"
                    placeholder="Task Title"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">XP Reward</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-sm"
                    value={taskXp}
                    onChange={(e) => setTaskXp(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Pretext</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm h-28 placeholder:text-slate-300 resize-none"
                  placeholder="Story, context, or instructions students read before the task"
                  value={taskPretext}
                  onChange={(e) => setTaskPretext(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Data Brief</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm h-24 placeholder:text-slate-300 resize-none"
                  placeholder="Paste data, excerpts, or references students should use"
                  value={taskData}
                  onChange={(e) => setTaskData(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">Quiz Questions</h4>
                  <p className="text-xs text-slate-500 font-medium">Multiple choice checks for the task.</p>
                </div>
                <button
                  onClick={() =>
                    setTaskQuestions((prev) => [
                      ...prev,
                      { prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" },
                    ])
                  }
                  className="px-3 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all"
                >
                  Add Question
                </button>
              </div>

              {taskQuestions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-semibold text-slate-400">
                  No questions yet. Add one to build the quiz section.
                </div>
              ) : (
                taskQuestions.map((question, qIdx) => (
                  <div key={`question-${qIdx}`} className="rounded-2xl border border-slate-200 p-5 space-y-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Question {qIdx + 1}</span>
                      <button
                        onClick={() => setTaskQuestions((prev) => prev.filter((_, idx) => idx !== qIdx))}
                        className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-sm"
                      placeholder="Question prompt"
                      value={question.prompt}
                      onChange={(e) =>
                        setTaskQuestions((prev) => prev.map((q, idx) => (idx === qIdx ? { ...q, prompt: e.target.value } : q)))
                      }
                    />
                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => (
                        <div key={`question-${qIdx}-opt-${optIdx}`} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setTaskQuestions((prev) =>
                                prev.map((q, idx) => (idx === qIdx ? { ...q, correctIndex: optIdx } : q))
                              )
                            }
                            className={`w-7 h-7 rounded-full border text-[11px] font-black flex items-center justify-center ${
                              question.correctIndex === optIdx
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-slate-100 border-slate-200 text-slate-400"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </button>
                          <input
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm"
                            placeholder={`Option ${optIdx + 1}`}
                            value={option}
                            onChange={(e) =>
                              setTaskQuestions((prev) =>
                                prev.map((q, idx) =>
                                  idx === qIdx
                                    ? {
                                        ...q,
                                        options: q.options.map((opt, oIdx) => (oIdx === optIdx ? e.target.value : opt)),
                                      }
                                    : q
                                )
                              )
                            }
                          />
                          {question.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() =>
                                setTaskQuestions((prev) =>
                                  prev.map((q, idx) => {
                                    if (idx !== qIdx) return q;
                                    const nextOptions = q.options.filter((_, oIdx) => oIdx !== optIdx);
                                    const nextCorrect =
                                      q.correctIndex === optIdx
                                        ? 0
                                        : q.correctIndex > optIdx
                                          ? q.correctIndex - 1
                                          : q.correctIndex;
                                    return {
                                      ...q,
                                      options: nextOptions,
                                      correctIndex: nextCorrect,
                                    };
                                  })
                                )
                              }
                              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      {question.options.length < MAX_OPTIONS && (
                        <button
                          type="button"
                          onClick={() =>
                            setTaskQuestions((prev) =>
                              prev.map((q, idx) => (idx === qIdx ? { ...q, options: [...q.options, ""] } : q))
                            )
                          }
                          className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700"
                        >
                          Add Option
                        </button>
                      )}
                    </div>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm h-20 placeholder:text-slate-300 resize-none"
                      placeholder="Explanation (optional)"
                      value={question.explanation || ""}
                      onChange={(e) =>
                        setTaskQuestions((prev) => prev.map((q, idx) => (idx === qIdx ? { ...q, explanation: e.target.value } : q)))
                      }
                    />
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">Flashcards</h4>
                  <p className="text-xs text-slate-500 font-medium">Quick flips for key facts.</p>
                </div>
                <button
                  onClick={() => setTaskFlashcards((prev) => [...prev, { front: "", back: "" }])}
                  className="px-3 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all"
                >
                  Add Card
                </button>
              </div>

              {taskFlashcards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-semibold text-slate-400">
                  No flashcards yet. Add some to reinforce the task.
                </div>
              ) : (
                taskFlashcards.map((card, cIdx) => (
                  <div key={`flashcard-${cIdx}`} className="rounded-2xl border border-slate-200 p-5 space-y-3 bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Card {cIdx + 1}</span>
                      <button
                        onClick={() => setTaskFlashcards((prev) => prev.filter((_, idx) => idx !== cIdx))}
                        className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-sm"
                      placeholder="Front text"
                      value={card.front}
                      onChange={(e) =>
                        setTaskFlashcards((prev) => prev.map((c, idx) => (idx === cIdx ? { ...c, front: e.target.value } : c)))
                      }
                    />
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-slate-700 text-sm"
                      placeholder="Back text"
                      value={card.back}
                      onChange={(e) =>
                        setTaskFlashcards((prev) => prev.map((c, idx) => (idx === cIdx ? { ...c, back: e.target.value } : c)))
                      }
                    />
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingTask(false)}
                className="flex-1 py-2.5 font-black text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-[0.2em]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={!isTaskReady}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-black shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {learningPath.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 space-y-4">
          <div className="flex justify-center">
            <BookMascot mood="sleepy" size={130} label={`${mascotName} waiting for tasks`} />
          </div>
          <p className="text-slate-500 font-bold">No tasks on the path yet.</p>
          <p className="text-xs text-slate-400 font-medium">Ask a teacher to add tasks to wake {mascotName} up.</p>
        </div>
      ) : (
        <section className="space-y-6">
          <div className="premium-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">All Tasks</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Learning Queue</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100/50 text-[11px] font-bold text-emerald-700">
                {completedTasks}/{totalTasks} cleared
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600">
                {overallProgress}% mastery
              </div>
              <div className="flex items-center gap-2">
                <BookMascot mood="happy" size={64} label={`${mascotName} ready`} />
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-6 bottom-6 w-[6px] bg-emerald-100/50 rounded-full" />
            <div className="space-y-6 pl-16">
              {learningPath.map((task: any, idx: number) => {
                const isCompleted = !!task.isCompleted;
                const isCurrent = firstIncompleteIndex === idx;
                const isLocked = firstIncompleteIndex !== -1 && idx > firstIncompleteIndex;
                const hasQuestions = (task.questions || []).length > 0;
                const hasFlashcards = (task.flashcards || []).length > 0;
                const cardMood = isLocked ? "sleepy" : isCompleted ? "happy" : "curious";

                return (
                  <div
                    key={task._id}
                    className={`premium-card p-6 relative overflow-hidden transition-all ${
                      isCompleted
                        ? "border-emerald-400"
                        : isLocked
                          ? "bg-slate-50 border-slate-200 hover:border-slate-200 hover:shadow-none"
                          : isCurrent
                            ? "border-emerald-400"
                            : ""
                    }`}
                  >
                    <div className="absolute -right-8 -bottom-6 opacity-80">
                      <BookMascot mood={cardMood} size={100} label={`${mascotName} task ${idx + 1}`} />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black ${
                              isCompleted
                                ? "bg-emerald-600 text-white"
                                : isLocked
                                  ? "bg-slate-200 text-slate-400"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Task</p>
                            <h4 className="text-lg font-black text-slate-900">{task.title}</h4>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> {task.xpAward} XP
                          </span>
                          {hasQuestions && (
                            <span className="text-slate-400 flex items-center gap-1">
                              <ClipboardCheck className="w-3 h-3" /> {task.questions.length} quiz
                            </span>
                          )}
                          {hasFlashcards && (
                            <span className="text-slate-400 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {task.flashcards.length} cards
                            </span>
                          )}
                          {(task.dataContext || "").trim() && (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Flame className="w-3 h-3" /> data brief
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isCompleted && (
                          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                            <Star className="w-3 h-3" /> Complete
                          </div>
                        )}
                        {user.role === "teacher" && (
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        )}
                        <button
                          onClick={() => openTask(task, isLocked)}
                          disabled={isLocked}
                          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                            isLocked
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-slate-900 text-white hover:bg-emerald-600"
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="w-4 h-4" /> Locked
                            </>
                          ) : isCompleted ? (
                            <>
                              <Check className="w-4 h-4" /> Review
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-4 h-4" /> Start
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200">
            <div className="bg-emerald-600 p-6 flex items-center justify-between text-white">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Task Mission</p>
                <h3 className="font-black tracking-tight text-xl">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-sm font-bold"
              >
                X
              </button>
            </div>
            <div className="px-8 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-emerald-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stageProgress}%` }} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Step {stageIndex + 1} / {stageSequence.length}
                </span>
              </div>
            </div>
            <div className="p-8 space-y-6">
              {taskStage === "pretext" && (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
                  <div className="space-y-4">
                    <h4 className="text-2xl font-black text-slate-900">Pretext</h4>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedTask.pretext || selectedTask.content}
                    </p>
                    <button
                      onClick={advanceStage}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                    >
                      Continue
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <BookMascot mood="curious" size={150} label={`${mascotName} intro`} className="drop-shadow-xl" />
                  </div>
                </div>
              )}

              {taskStage === "data" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-slate-900">Data Brief</h4>
                      <p className="text-xs text-slate-500 font-medium">Use this info to solve the task.</p>
                    </div>
                    <BookMascot mood="happy" size={72} label={`${mascotName} data`} />
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <pre className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{selectedTask.dataContext}</pre>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={advanceStage}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {taskStage === "flashcards" && activeFlashcard && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-slate-900">Flashcards</h4>
                      <p className="text-xs text-slate-500 font-medium">Card {flashcardIndex + 1} of {selectedTask.flashcards.length}</p>
                    </div>
                    <BookMascot mood="happy" size={72} label={`${mascotName} flashcards`} />
                  </div>
                  <div className="relative h-48 md:h-56 w-full" style={{ perspective: "1200px" }}>
                    <div
                      className={`absolute inset-0 rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition-transform duration-500 ${
                        flashcardFlipped ? "rotate-y-180" : ""
                      }`}
                      style={{
                        transformStyle: "preserve-3d",
                        transform: flashcardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                    >
                      <div
                        className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Front</div>
                        <div className="text-xl font-black text-slate-900">{activeFlashcard.front}</div>
                      </div>
                      <div
                        className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        <div className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Back</div>
                        <div className="text-xl font-black text-slate-900">{activeFlashcard.back}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={handleFlashcardPrev}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-40"
                      disabled={flashcardIndex === 0}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFlashcardFlipped((prev) => !prev)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Flip
                    </button>
                    <button
                      onClick={handleFlashcardNext}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                    >
                      {flashcardIndex === selectedTask.flashcards.length - 1 ? "Continue" : "Next"}
                    </button>
                  </div>
                </div>
              )}

              {taskStage === "quiz" && activeQuestion && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-slate-900">Quiz</h4>
                      <p className="text-xs text-slate-500 font-medium">Question {questionIndex + 1} of {selectedTask.questions.length}</p>
                    </div>
                    <BookMascot mood={showAnswer && selectedOptionIndex === activeQuestion.correctIndex ? "happy" : "curious"} size={70} label={`${mascotName} quiz`} />
                  </div>
                  <div className="rounded-2xl border border-emerald-100 p-6 bg-emerald-50/50">
                    <p className="text-base font-bold text-slate-900">{activeQuestion.prompt}</p>
                  </div>
                  <div className="grid gap-3">
                    {activeQuestion.options.map((opt: string, optIdx: number) => {
                      const isSelected = selectedOptionIndex === optIdx;
                      const isCorrect = showAnswer && optIdx === activeQuestion.correctIndex;
                      const isIncorrect = showAnswer && isSelected && optIdx !== activeQuestion.correctIndex;
                      return (
                        <button
                          key={`task-question-${questionIndex}-opt-${optIdx}`}
                          onClick={() => {
                            if (showAnswer) return;
                            setSelectedOptionIndex(optIdx);
                          }}
                          className={`w-full text-left px-5 py-3 rounded-2xl border text-sm font-bold transition-all ${
                            isCorrect
                              ? "border-emerald-500 bg-emerald-100 text-emerald-800"
                              : isIncorrect
                                ? "border-rose-500 bg-rose-50 text-rose-700"
                                : isSelected
                                  ? "border-emerald-400 bg-white text-emerald-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {showAnswer && activeQuestion.explanation && (
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-xs text-slate-600 font-medium">
                      {activeQuestion.explanation}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] font-bold text-slate-500">
                      {selectedOptionIndex === null
                        ? "Pick an answer to continue"
                        : showAnswer
                          ? selectedOptionIndex === activeQuestion.correctIndex
                            ? "Correct!"
                            : "Not quite — try the next one"
                          : "Ready to check?"}
                    </div>
                    {!showAnswer ? (
                      <button
                        onClick={handleCheckAnswer}
                        disabled={selectedOptionIndex === null}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                      >
                        Check
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                      >
                        {questionIndex === selectedTask.questions.length - 1 ? "Finish" : "Next"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {taskStage === "complete" && (
                <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] items-center">
                  <div className="space-y-4">
                    <h4 className="text-2xl font-black text-slate-900">Task Complete</h4>
                    <p className="text-sm text-slate-600 font-medium">
                      You earned <span className="text-emerald-600 font-black">+{selectedTask.xpAward} XP</span>. {selectedTask.questions?.length
                        ? `Score: ${correctAnswers}/${selectedTask.questions.length}`
                        : "Great work."}
                    </p>
                    {user.role === "student" && (
                      <button
                        disabled={selectedTask.isCompleted}
                        onClick={async () => {
                          await handleComplete(selectedTask._id);
                          setSelectedTask(null);
                        }}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                      >
                        {selectedTask.isCompleted ? "Completed" : "Finish Task"}
                      </button>
                    )}
                    {user.role !== "student" && (
                      <button
                        onClick={() => setSelectedTask(null)}
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                      >
                        Close Preview
                      </button>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <BookMascot mood="happy" size={160} label={`${mascotName} celebration`} className="drop-shadow-xl" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
