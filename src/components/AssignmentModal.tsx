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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Assignment</h2>
          <p className="text-slate-500 font-medium italic truncate">File: {file.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
            <span className="font-bold text-slate-700">Timed Assignment</span>
            <button
              type="button"
              onClick={() => setTimed(!timed)}
              className={`w-14 h-8 rounded-full transition-all relative ${timed ? 'bg-pastel-blue' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${timed ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {timed && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none font-bold text-slate-700"
                min="1"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none font-bold text-slate-700"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 transition-colors tracking-widest"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all tracking-widest"
            >
              ASSIGN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
