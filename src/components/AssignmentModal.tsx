import { useState } from "react";
import { Doc } from "../../convex/_generated/dataModel";

interface AssignmentModalProps {
  file: Doc<"files">;
  onClose: () => void;
}

export function AssignmentModal({ file, onClose }: AssignmentModalProps) {
  const [timed, setTimed] = useState(false);
  const [duration, setDuration] = useState(60);
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for creating actual assignment record would go here
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-md p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
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
              className={`w-12 h-6 rounded-full transition-all relative ${timed ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${timed ? 'left-6.5' : 'left-0.5'}`} />
            </button>
          </div>

          {timed && (
            <div className="animate-in slide-in-from-top-1 duration-200">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
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
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-slate-700 text-sm"
            />
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
