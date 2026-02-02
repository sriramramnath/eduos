import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClassView } from "./ClassView";

interface ClassDashboardProps {
  user: any;
  classes: any[];
}

export function ClassDashboard({ user, classes }: ClassDashboardProps) {
  const [selectedClass, setSelectedClass] = useState<any>(null);
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Classes</h1>
          <p className="text-slate-500 font-medium">Manage your learning workspaces and students.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowJoinClass(true)}
            className="px-6 py-3 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 hover:scale-105"
          >
            <span>🔗</span> Join Class
          </button>
          {user.role === "teacher" && (
            <button
              onClick={() => setShowCreateClass(true)}
              className="px-6 py-3 rounded-2xl bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>✨</span> Create Class
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-6xl animate-float">
              🏫
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Your Digital Workspace</h2>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                Every great journey starts with a single class. Create your first one to begin the EduOS experience.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowJoinClass(true)}
                className="px-10 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-slate-600 hover:bg-slate-50 transition-all shadow-xl shadow-slate-200/50"
              >
                JOIN CLASS
              </button>
              <button
                onClick={() => setShowCreateClass(true)}
                className="px-10 py-5 bg-brand-primary text-white rounded-3xl font-black shadow-2xl shadow-brand-primary/20 hover:scale-105 transition-all"
              >
                CREATE FIRST CLASS
              </button>
            </div>
          </div>
        ) : (
          classes.map((c) => {
            return (
              <div
                key={c._id}
                onClick={() => setSelectedClass(c)}
                className="premium-card group cursor-pointer hover-scale-premium relative overflow-hidden"
              >
                {/* Visual Header */}
                <div className="h-40 bg-slate-900 relative overflow-hidden flex items-end p-8">
                  {/* Decorative background circle */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-pastel-blue/20 transition-all duration-700"></div>

                  <h3 className="text-2xl font-black text-white relative z-10 tracking-tight leading-tight transition-transform duration-500 group-hover:translate-x-1">
                    {c.name}
                  </h3>
                </div>
                {/* Content */}
                <div className="p-8 space-y-6">
                  <p className="text-slate-500 font-medium line-clamp-2 h-12 leading-relaxed">
                    {c.description || "No class overview provided. Join now to explore the curriculum."}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${c.teacherId === user.email ? "bg-pastel-blue/10 text-pastel-blue border border-pastel-blue/20" : "bg-pastel-purple/10 text-pastel-purple border border-pastel-purple/20"
                      }`}>
                      {c.teacherId === user.email ? "Your Class" : "Enrolled"}
                    </span>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      CODE: {c.code}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Create New Class</h3>
              <p className="text-slate-500 font-medium italic">Start a new learning workspace</p>
            </div>

            <div className="space-y-4">
              <input
                className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                placeholder="Class Name (e.g. Advanced AI)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
              <textarea
                className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none transition-all font-medium text-slate-600 h-32 placeholder:text-slate-300"
                placeholder="Class Description"
                value={newClassDescription}
                onChange={(e) => setNewClassDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateClass(false)}
                className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateClass}
                className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all"
              >
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinClass && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Join a Class</h3>
              <p className="text-slate-500 font-medium italic">Enter your unique class code</p>
            </div>

            <input
              className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-brand-primary rounded-3xl outline-none transition-all font-black text-center text-3xl tracking-widest text-slate-700 placeholder:text-slate-200"
              placeholder="CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />

            <div className="flex gap-4">
              <button
                onClick={() => setShowJoinClass(false)}
                className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleJoinClass}
                className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all"
              >
                JOIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
