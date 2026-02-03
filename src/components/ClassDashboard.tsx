import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClassView } from "./ClassView";
import { Link, Plus, School } from "lucide-react";

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
            className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 hover:translate-y-[-1px]"
          >
            <Link className="w-4 h-4" /> Join Class
          </button>
          {user.role === "teacher" && (
            <button
              onClick={() => setShowCreateClass(true)}
              className="px-6 py-3 rounded-xl bg-brand-primary text-white font-bold shadow-md shadow-brand-primary/10 hover:translate-y-[-1px] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Class
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
              <School className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Digital Workspace</h2>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed text-sm">
                Every great journey starts with a single class. Create your first one to begin the EduOS experience.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowJoinClass(true)}
                className="px-8 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest shadow-sm"
              >
                JOIN CLASS
              </button>
              <button
                onClick={() => setShowCreateClass(true)}
                className="px-8 py-4 bg-brand-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/10 hover:-translate-y-0.5 transition-all"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-1 text-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                <Plus className="w-6 h-6 text-brand-primary" /> Create New Class
              </h3>
              <p className="text-slate-500 font-medium text-sm">Start a new learning workspace</p>
            </div>

            <div className="space-y-3">
              <input
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                placeholder="Class Name (e.g. Advanced AI)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
              <textarea
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none transition-all font-medium text-slate-600 h-28 placeholder:text-slate-300 resize-none"
                placeholder="Class Description"
                value={newClassDescription}
                onChange={(e) => setNewClassDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateClass(false)}
                className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors text-sm"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateClass}
                className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-bold shadow-md shadow-brand-primary/10 hover:-translate-y-0.5 transition-all text-sm"
              >
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinClass && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-1 text-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                <Link className="w-6 h-6 text-brand-primary" /> Join a Class
              </h3>
              <p className="text-slate-500 font-medium text-sm">Enter your unique class code</p>
            </div>

            <input
              className="w-full p-5 bg-slate-50 border border-slate-200 focus:border-brand-primary rounded-xl outline-none transition-all font-black text-center text-4xl tracking-[0.25em] text-slate-700 placeholder:text-slate-200"
              placeholder="000000"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinClass(false)}
                className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors text-sm"
              >
                CANCEL
              </button>
              <button
                onClick={handleJoinClass}
                className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-bold shadow-md shadow-brand-primary/10 hover:-translate-y-0.5 transition-all text-sm"
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
