import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { BarChart3, Eye, EyeOff, Filter, Plus, Save, Trash2 } from "lucide-react";

interface GradebookProps {
  classId: Id<"classes">;
  user: any;
}

type DraftGrade = {
  score: string;
  letter: string;
};

const LETTER_GRADES = ["A", "B", "C", "D", "F"];

export function Gradebook({ classId, user }: GradebookProps) {
  const exams = useQuery(api.myFunctions.getClassExams, { classId }) || [];
  const grades = useQuery(api.myFunctions.getClassGrades, { classId }) || [];
  const members = useQuery(api.myFunctions.getClassMembers, { classId }) || [];
  const isPro = user?.email === "sriramramnath2011@gmail.com";

  const createExam = useMutation(api.myFunctions.createExam);
  const updateExam = useMutation(api.myFunctions.updateExam);
  const deleteExam = useMutation(api.myFunctions.deleteExam);
  const setGrade = useMutation(api.myFunctions.setGrade);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [newExamVisible, setNewExamVisible] = useState(true);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"name" | "avg_desc" | "avg_asc">("name");
  const [drafts, setDrafts] = useState<Record<string, DraftGrade>>({});
  const [examNameDrafts, setExamNameDrafts] = useState<Record<string, string>>({});

  const gradesByKey = useMemo(() => {
    const map = new Map<string, { score?: number; letterGrade?: string }>();
    grades.forEach((grade) => {
      map.set(`${grade.examId}:${grade.studentId}`, {
        score: grade.score,
        letterGrade: grade.letterGrade,
      });
    });
    return map;
  }, [grades]);

  const studentRows = useMemo(() => {
    const rows = members
      .filter((m) => m.name?.toLowerCase().includes(search.toLowerCase()))
      .map((m) => {
        const scores = exams
          .map((exam) => gradesByKey.get(`${exam._id}:${m.email}`)?.score)
          .filter((s) => typeof s === "number") as number[];
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        return { ...m, avg };
      });

    if (sortMode === "avg_desc") {
      rows.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
    } else if (sortMode === "avg_asc") {
      rows.sort((a, b) => (a.avg ?? 999) - (b.avg ?? 999));
    } else {
      rows.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    return rows;
  }, [members, search, sortMode, exams, gradesByKey]);

  const analytics = useMemo(() => {
    const totalStudents = members.length;
    const totalExams = exams.length;

    const allScores = grades
      .map((g) => g.score)
      .filter((s) => typeof s === "number") as number[];
    const overallAvg = allScores.length
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
      : null;

    const perExam = exams.map((exam) => {
      const scores = grades
        .filter((g) => g.examId === exam._id && typeof g.score === "number")
        .map((g) => g.score as number);
      const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
      return { exam, avg, count: scores.length };
    });

    const letterCounts: Record<string, number> = {};
    LETTER_GRADES.forEach((l) => (letterCounts[l] = 0));
    grades.forEach((g) => {
      if (g.letterGrade && letterCounts[g.letterGrade] !== undefined) {
        letterCounts[g.letterGrade] += 1;
      }
    });

    return { totalStudents, totalExams, overallAvg, perExam, letterCounts };
  }, [members.length, exams, grades]);

  const getDraftKey = (examId: string, studentId: string) => `${examId}:${studentId}`;

  const getDraft = (examId: string, studentId: string) => {
    const key = getDraftKey(examId, studentId);
    if (drafts[key]) return drafts[key];
    const current = gradesByKey.get(key);
    return {
      score: current?.score !== undefined ? String(current.score) : "",
      letter: current?.letterGrade || "",
    };
  };

  const updateDraft = (examId: string, studentId: string, patch: Partial<DraftGrade>) => {
    const key = getDraftKey(examId, studentId);
    setDrafts((prev) => ({
      ...prev,
      [key]: {
        ...getDraft(examId, studentId),
        ...patch,
      },
    }));
  };

  const getExamNameDraft = (examId: string, fallback: string) => {
    return examNameDrafts[examId] ?? fallback;
  };

  const updateExamNameDraft = (examId: string, name: string) => {
    setExamNameDrafts((prev) => ({ ...prev, [examId]: name }));
  };

  const handleSaveGrade = async (examId: Id<"exams">, studentId: string) => {
    const draft = getDraft(examId, studentId);
    const score = draft.score.trim() === "" ? undefined : Number(draft.score);
    const letterGrade = draft.letter.trim() === "" ? undefined : draft.letter.trim();
    await setGrade({
      classId,
      examId,
      studentId,
      score: Number.isNaN(score as number) ? undefined : score,
      letterGrade,
    });
  };

  if (user.role !== "teacher") {
    const myGrades = grades
      .map((grade) => ({
        grade,
        exam: exams.find((e) => e._id === grade.examId),
      }))
      .filter((item) => item.exam);

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Analytics</h2>
            <p className="text-sm text-slate-500 font-medium">Your exam performance and progress.</p>
          </div>
          <div className="px-3 py-1.5 bg-emerald-100/50 rounded-lg border border-emerald-200/50 shadow-sm text-emerald-700 font-black text-xs tracking-tight">
            XP: {user.xp || 0}
          </div>
        </div>

        <div className="premium-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myGrades.map(({ grade, exam }) => (
              <div key={grade._id} className="rounded-xl border border-slate-200 p-4 bg-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{exam?.name}</p>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-black text-slate-900">{grade.score ?? "—"}</div>
                  <div className="text-sm font-bold text-emerald-600">{grade.letterGrade ?? ""}</div>
                </div>
              </div>
            ))}
            {myGrades.length === 0 && (
              <div className="text-center py-10 text-slate-400 font-bold">No grades published yet.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`space-y-10 ${isPro ? "" : "blur-[2px] pointer-events-none select-none"}`}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Analytics</h2>
            <p className="text-sm text-slate-500 font-medium">Track performance, analyze trends, and share results.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm">
              <Filter className="w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter students..."
                className="bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-700"
            >
              <option value="name">Sort: Name</option>
              <option value="avg_desc">Sort: Avg (High)</option>
              <option value="avg_asc">Sort: Avg (Low)</option>
            </select>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Exam
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="premium-card p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Students</p>
            <p className="text-2xl font-black text-slate-900 mt-2">{analytics.totalStudents}</p>
          </div>
          <div className="premium-card p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exams</p>
            <p className="text-2xl font-black text-slate-900 mt-2">{analytics.totalExams}</p>
          </div>
          <div className="premium-card p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall Avg</p>
            <p className="text-2xl font-black text-slate-900 mt-2">{analytics.overallAvg ?? "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="premium-card p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Average by Exam</h3>
            </div>
            <div className="space-y-3">
              {analytics.perExam.map(({ exam, avg }) => (
                <div key={exam._id} className="flex items-center gap-3">
                  <div className="w-28 text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
                    {exam.name}
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${avg ? Math.min(avg, 100) : 0}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-right text-xs font-bold text-slate-600">{avg ?? "—"}</div>
                </div>
              ))}
              {analytics.perExam.length === 0 && (
                <p className="text-sm text-slate-400 font-medium">No exams yet.</p>
              )}
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Letter Grade Mix</h3>
            </div>
            <div className="space-y-3">
              {LETTER_GRADES.map((letter) => {
                const count = analytics.letterCounts[letter] || 0;
                const max = Math.max(1, ...Object.values(analytics.letterCounts));
                return (
                  <div key={letter} className="flex items-center gap-3">
                    <div className="w-6 text-xs font-black text-slate-600">{letter}</div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full" style={{ width: `${(count / max) * 100}%` }}></div>
                    </div>
                    <div className="w-8 text-right text-xs font-bold text-slate-600">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="premium-card p-4 overflow-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[220px_repeat(auto-fit,minmax(200px,1fr))] gap-2 mb-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3">Students</div>
              {exams.map((exam) => (
                <div key={exam._id} className="px-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={getExamNameDraft(exam._id, exam.name)}
                      onChange={(e) => updateExamNameDraft(exam._id, e.target.value)}
                      onBlur={() => {
                        const draft = getExamNameDraft(exam._id, exam.name).trim();
                        if (draft && draft !== exam.name) {
                          updateExam({ examId: exam._id, name: draft });
                        }
                      }}
                      className="w-full text-[11px] font-black uppercase tracking-widest text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1"
                    />
                    <button
                      onClick={() => updateExam({ examId: exam._id, isVisibleToStudents: !exam.isVisibleToStudents })}
                      className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                      title={exam.isVisibleToStudents ? "Visible to students" : "Hidden from students"}
                    >
                      {exam.isVisibleToStudents ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteExam({ examId: exam._id })}
                      className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all"
                      title="Delete exam"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {studentRows.map((student) => (
              <div key={student.email} className="grid grid-cols-[220px_repeat(auto-fit,minmax(200px,1fr))] gap-2 mb-2">
                <div className="px-3 py-3 bg-slate-50 rounded-md border border-slate-100">
                  <p className="text-sm font-bold text-slate-800 truncate">{student.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{student.email}</p>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-2">XP {student.xp || 0}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Avg {student.avg !== null ? student.avg.toFixed(1) : "—"}
                  </p>
                </div>
                {exams.map((exam) => {
                  const draft = getDraft(exam._id, student.email);
                  return (
                    <div key={exam._id} className="px-2 py-2 bg-white border border-slate-100 rounded-md">
                      <div className="flex items-center gap-2">
                        <input
                          value={draft.score}
                          onChange={(e) => updateDraft(exam._id, student.email, { score: e.target.value })}
                          placeholder="Score"
                          className="w-20 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1"
                        />
                        <select
                          value={draft.letter}
                          onChange={(e) => updateDraft(exam._id, student.email, { letter: e.target.value })}
                          className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1"
                        >
                          <option value="">—</option>
                          {LETTER_GRADES.map((letter) => (
                            <option key={letter} value={letter}>
                              {letter}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveGrade(exam._id, student.email)}
                          className="ml-auto w-8 h-8 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                          title="Save grade"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {studentRows.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-bold">No students found.</div>
            )}
          </div>
        </div>

        {isAddOpen && (
          <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Exam</h3>
                <p className="text-xs text-slate-500 font-medium">Create a new exam column.</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exam Name</label>
                <input
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  placeholder="Midterm, Quiz 3, Final..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={newExamVisible}
                  onChange={(e) => setNewExamVisible(e.target.checked)}
                />
                Visible to students
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newExamName.trim()) return;
                    await createExam({ classId, name: newExamName.trim(), isVisibleToStudents: newExamVisible });
                    setNewExamName("");
                    setNewExamVisible(true);
                    setIsAddOpen(false);
                  }}
                  disabled={!newExamName.trim()}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isPro && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-xl border border-emerald-200 rounded-2xl px-6 py-5 shadow-xl text-center max-w-md">
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-2">Premium Feature</p>
          <h3 className="text-xl font-black text-slate-900 mb-2">This is a premium feature</h3>
          <p className="text-sm text-slate-600 font-medium mb-4">Please upgrade to Plus to unlock analytics.</p>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center bg-emerald-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all"
          >
            Upgrade to Plus
          </a>
        </div>
      </div>
      )}
    </div>
  );
}
