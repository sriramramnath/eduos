import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClassView } from "./ClassView";
import { Link, Plus, School } from "lucide-react";

interface ClassDashboardProps {
  user: any;
  classes: any[];
  selectedClass: any;
  setSelectedClass: (cls: any) => void;
}

export function ClassDashboard({ user, classes, selectedClass, setSelectedClass }: ClassDashboardProps) {
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showJoinClass, setShowJoinClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const createClass = useMutation(api.myFunctions.createClass);
  const joinClass = useMutation(api.myFunctions.joinClass);

  const handleCreateClass = async () => {
    if (!newClassName) return;
    await createClass({ name: newClassName, description: newClassDescription });
    setShowCreateClass(false);
    setNewClassName("");
    setNewClassDescription("");
  };

  const handleJoinClass = async () => {
    if (!joinCode) return;
    await joinClass({ code: joinCode });
    setShowJoinClass(false);
    setJoinCode("");
  };

  if (selectedClass) {
    return (
      <ClassView
        classId={selectedClass._id}
        user={user}
        onBack={() => setSelectedClass(null)}
      />
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Classes</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your learning workspaces.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoinClass(true)}
            className="px-4 py-2 rounded-md border border-slate-200 font-bold text-[11px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Link className="w-3.5 h-3.5" /> Join
          </button>
          {user.role === "teacher" && (
            <button
              onClick={() => setShowCreateClass(true)}
              className="px-4 py-2 rounded-md bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 col-span-full">
            <div className="w-20 h-20 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-300 border border-emerald-100">
              <School className="w-10 h-10" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Workspace</h2>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed text-sm">
                Create your first class to begin the journey.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinClass(true)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-md font-bold text-slate-600 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest"
              >
                JOIN CLASS
              </button>
              <button
                onClick={() => setShowCreateClass(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all"
              >
                CREATE CLASS
              </button>
            </div>
          </div>
        ) : (
          classes.map((c) => {
            return (
              <div
                key={c._id}
                onClick={() => setSelectedClass(c)}
                className="premium-card group cursor-pointer overflow-hidden border-slate-200"
              >
                {/* Visual Header with Banner */}
                <div className="h-32 bg-slate-900 relative overflow-hidden flex items-end p-6">
                  {c.bannerUrl && (
                    <img
                      src={c.bannerUrl}
                      alt={c.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                  <h3 className="text-xl font-bold text-white relative z-10 tracking-tight leading-tight group-hover:text-emerald-400 transition-colors">
                    {c.name}
                  </h3>
                </div>
                {/* Content */}
                <div className="p-6 space-y-4">
                  <p className="text-slate-500 font-medium line-clamp-2 h-10 text-sm leading-relaxed">
                    {c.description || "Project workspace • Ongoing session"}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${c.teacherId === user.email ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}>
                      {c.teacherId === user.email ? "Teacher" : "Student"}
                    </span>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {c.code}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreateClass && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-md p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Create Workspace</h3>
              <p className="text-slate-500 font-medium text-xs">Start a new classroom instance</p>
            </div>

            <div className="space-y-3">
              <input
                className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-sm placeholder:text-slate-300"
                placeholder="Class Name"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
              <textarea
                className="w-full px-4 py-3 rounded-md bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-slate-600 text-sm h-24 placeholder:text-slate-300 resize-none"
                placeholder="Description"
                value={newClassDescription}
                onChange={(e) => setNewClassDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateClass(false)}
                className="flex-1 py-2.5 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-widest"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinClass && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-md p-8 max-w-xs w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Join Class</h3>
              <p className="text-slate-500 font-medium text-xs">Enter your 6-digit access code</p>
            </div>

            <input
              className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-md outline-none transition-all font-bold text-center text-4xl tracking-[0.2em] text-slate-700 placeholder:text-slate-200"
              placeholder="000000"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowJoinClass(false)}
                className="flex-1 py-2.5 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinClass}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-widest"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
