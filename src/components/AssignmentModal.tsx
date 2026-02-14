import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

interface AssignmentModalProps {
  file: Doc<"files">;
  onClose: () => void;
}

export function AssignmentModal({ file, onClose }: AssignmentModalProps) {
  const [timed, setTimed] = useState(false);
  const [duration, setDuration] = useState(60);
  const [dueDate, setDueDate] = useState(file.dueDate ? new Date(file.dueDate).toISOString().slice(0, 16) : "");
  const [instructions, setInstructions] = useState(file.instructions || "");
  const [questionPromptsText, setQuestionPromptsText] = useState((file.questionPrompts || []).join("\n"));
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>((file.outcomeIds as any) || []);
  const [latePolicy, setLatePolicy] = useState<"allow" | "penalty" | "block">((file as any).latePolicy || "allow");
  const [maxResubmissions, setMaxResubmissions] = useState<number>((file as any).maxResubmissions ?? 3);
  const [allowComments, setAllowComments] = useState<boolean>((file as any).allowComments ?? true);
  const [rubricText, setRubricText] = useState(
    ((file as any).rubric || [])
      .map((item: any) => `${item.criterion}|${item.maxPoints}`)
      .join("\n")
  );
  const outcomes = useQuery(api.myFunctions.getOutcomes, { classId: file.classId }) || [];
  const updateAssignmentDetails = useMutation(api.myFunctions.updateAssignmentDetails);
  const setAssignmentPolicy = useMutation((api as any).featureFunctions.setAssignmentPolicy);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const questionPrompts = questionPromptsText
      .split("\n")
      .map((prompt: string) => prompt.trim())
      .filter(Boolean);
    const rubric = rubricText
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean)
      .map((line: string) => {
        const [criterion, points] = line.split("|");
        return {
          criterion: (criterion || "").trim(),
          maxPoints: Number(points || 0),
        };
      })
      .filter((item: { criterion: string; maxPoints: number }) => item.criterion && Number.isFinite(item.maxPoints) && item.maxPoints > 0);

    void (async () => {
      await updateAssignmentDetails({
        fileId: file._id,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        instructions: instructions || undefined,
        questionPrompts: questionPrompts.length ? questionPrompts : undefined,
        outcomeIds: selectedOutcomes.length ? (selectedOutcomes as any) : undefined,
      });
      await setAssignmentPolicy({
        fileId: file._id,
        latePolicy,
        maxResubmissions,
        allowComments,
        rubric: rubric.length ? rubric : undefined,
      });
      onClose();
    })();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl p-6 md:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assignment</h2>
          <p className="text-slate-500 font-medium text-xs truncate">{file.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-200">
            <span className="font-bold text-slate-700 text-sm">Timed Session</span>
            <button
              type="button"
              onClick={() => setTimed(!timed)}
              role="switch"
              aria-checked={timed}
              aria-label="Timed session"
              className={`w-12 h-6 rounded-full transition-all relative ${timed ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${timed ? 'left-6.5' : 'left-0.5'}`} />
            </button>
          </div>

          {timed && (
            <div className="animate-in slide-in-from-top-1 duration-200">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5 ml-1">
                Duration (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700 text-sm"
                min="1"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5 ml-1">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5 ml-1">
                Late Policy
              </label>
              <select
                value={latePolicy}
                onChange={(e) => setLatePolicy(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700 text-sm"
              >
                <option value="allow">Allow late</option>
                <option value="penalty">Allow with penalty</option>
                <option value="block">Block late</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5 ml-1">
                Max Resubmissions
              </label>
              <input
                type="number"
                min={1}
                value={maxResubmissions}
                onChange={(e) => setMaxResubmissions(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-200">
            <span className="font-bold text-slate-700 text-sm">Allow file comments</span>
            <button
              type="button"
              onClick={() => setAllowComments((prev) => !prev)}
              className={`w-12 h-6 rounded-full transition-all relative ${allowComments ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${allowComments ? 'left-6.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5 ml-1">
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-600 text-sm h-24 resize-none"
              placeholder="Add assignment instructions"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5 ml-1">
              Questions (One Per Line)
            </label>
            <textarea
              value={questionPromptsText}
              onChange={(e) => setQuestionPromptsText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-600 text-sm h-28 resize-y"
              placeholder={"What is the main idea?\nSolve #1-5 and show your work.\nSummarize the article in 3 sentences."}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5 ml-1">
              Rubric (criterion|points per line)
            </label>
            <textarea
              value={rubricText}
              onChange={(e) => setRubricText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-medium text-slate-600 text-sm h-24 resize-y"
              placeholder={"Argument quality|5\nEvidence use|5\nClarity|3"}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5 ml-1">
              Outcomes
            </label>
            {outcomes.length === 0 ? (
              <div className="text-xs text-slate-400 font-medium">No outcomes yet. Add outcomes in Classwork.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {outcomes.map((o: any) => {
                  const active = selectedOutcomes.includes(o._id);
                  return (
                    <button
                      type="button"
                      key={o._id}
                      onClick={() => {
                        setSelectedOutcomes((prev) =>
                          prev.includes(o._id) ? prev.filter((id) => id !== o._id) : [...prev, o._id]
                        );
                      }}
                      className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.08em] ${active ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-500"}`}
                    >
                      {o.code}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-2.5 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-widest"
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
