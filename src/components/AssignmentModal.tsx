import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

interface AssignmentModalProps {
  file: Doc<"files">;
  onClose: () => void;
}

export function AssignmentModal({ file, onClose }: AssignmentModalProps) {
  const [timed, setTimed] = useState(false);
  const [duration, setDuration] = useState(60);
  const [dueDate, setDueDate] = useState("");
  
  const createAssignment = useMutation(api.functions.createAssignment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createAssignment({
        fileId: file._id,
        classId: file.classId!, // Assuming file has classId
        timed,
        durationMinutes: timed ? duration : undefined,
        dueAt: dueDate ? new Date(dueDate).getTime() : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create assignment:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Create Assignment</h2>
        <p className="text-gray-600 mb-4">File: {file.name}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={timed}
                onChange={(e) => setTimed(e.target.checked)}
              />
              <span>Timed assignment</span>
            </label>
          </div>
          
          {timed && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
                min="1"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Due date (optional)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Create Assignment
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
