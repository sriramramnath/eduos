import { Doc } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface TimerPanelProps {
  timers: Doc<"timers">[];
}

export function TimerPanel({ timers }: TimerPanelProps) {
  const startTimer = useMutation(api.functions.startTimer);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="font-semibold mb-4">Active Timers</h3>
      
      {timers.length === 0 ? (
        <p className="text-gray-500 text-sm">No active timers</p>
      ) : (
        <div className="space-y-3">
          {timers.map((timer) => {
            const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
            return (
              <div key={timer._id} className="p-3 bg-blue-50 rounded border">
                <div className="font-mono text-lg">{formatTime(elapsed)}</div>
                <div className="text-sm text-gray-600 mt-1">Assignment Timer</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
