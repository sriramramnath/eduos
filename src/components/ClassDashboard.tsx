import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClassView } from "./ClassView";
import { BookMascot } from "./BookMascot";
import { Archive, Copy, Eye, EyeOff, Link, Plus, RotateCcw, School, Settings } from "lucide-react";

interface ClassDashboardProps {
  user: any;
  classes: any[];
  selectedClass: any;
  setSelectedClass: (cls: any) => void;
  onOpenSettings: () => void;
}

export function ClassDashboard({ user, classes, selectedClass, setSelectedClass, onOpenSettings }: ClassDashboardProps) {
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showJoinClass, setShowJoinClass] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [actionLoadingClassId, setActionLoadingClassId] = useState<string | null>(null);

  const createClass = useMutation(api.myFunctions.createClass);
  const joinClass = useMutation(api.myFunctions.joinClass);

  const featureApi = (api as any).featureFunctions;
  const updateClassLifecycle = useMutation(featureApi.updateClassLifecycle);
  const duplicateClassWorkspace = useMutation(featureApi.duplicateClassWorkspace);
  const joinWithInvite = useMutation(featureApi.joinWithInvite);
  const requestJoinByClassCode = useMutation(featureApi.requestJoinByClassCode);

  const visibleClasses = useMemo(
    () => (showArchived ? classes : classes.filter((cls) => !cls.archived)),
    [classes, showArchived]
  );

  const handleCreateClass = async () => {
    if (!newClassName) return;
    await createClass({ name: newClassName, description: newClassDescription });
    setShowCreateClass(false);
    setNewClassName("");
    setNewClassDescription("");
  };

  const handleJoinClass = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;

    setJoinMessage("");

    try {
      await joinWithInvite({ code });
      setJoinMessage("Joined class using invite.");
      setJoinCode("");
      return;
    } catch {
      // Fall through to request/direct join.
    }

    try {
      const result = await requestJoinByClassCode({ code });
      if (result?.status === "submitted") {
        setJoinMessage("Join request sent to teacher.");
      } else if (result?.status === "pending") {
        setJoinMessage("You already have a pending request.");
      } else if (result?.status === "already_member") {
        setJoinMessage("You are already in this class.");
      } else {
        await joinClass({ code });
        setJoinMessage("Joined class.");
      }
      setJoinCode("");
    } catch {
      try {
        await joinClass({ code });
        setJoinMessage("Joined class.");
        setJoinCode("");
      } catch {
        setJoinMessage("Could not join class with this code.");
      }
    }
  };

  const toggleArchive = async (classId: string, archived: boolean) => {
    setActionLoadingClassId(classId);
    try {
      await updateClassLifecycle({ classId, archived: !archived });
    } finally {
      setActionLoadingClassId(null);
    }
  };

  const duplicateClass = async (classId: string, className: string) => {
    setActionLoadingClassId(classId);
    try {
      await duplicateClassWorkspace({ classId, name: `${className} (Copy)` });
    } finally {
      setActionLoadingClassId(null);
    }
  };

  if (selectedClass) {
    return (
      <ClassView
        classId={selectedClass._id}
        user={user}
        onBack={() => setSelectedClass(null)}
        onOpenSettings={onOpenSettings}
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
            onClick={() => setShowArchived((prev) => !prev)}
            className="px-4 py-2 rounded-md border border-slate-200 font-bold text-[11px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {showArchived ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 rounded-md border border-slate-200 font-bold text-[11px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
          <button
            onClick={() => {
              setJoinMessage("");
              setShowJoinClass(true);
            }}
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
        {visibleClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 col-span-full">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-300 border border-emerald-100">
                <School className="w-10 h-10" />
              </div>
              <BookMascot mood="sleepy" size={90} label="Pagey waiting" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Workspace</h2>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed text-sm">
                Create or join a class to get started.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinClass(true)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-md font-bold text-slate-600 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest"
              >
                JOIN CLASS
              </button>
              {user.role === "teacher" && (
                <button
                  onClick={() => setShowCreateClass(true)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all"
                >
                  CREATE CLASS
                </button>
              )}
            </div>
          </div>
        ) : (
          visibleClasses.map((c) => {
            const isLoading = actionLoadingClassId === c._id;
            return (
              <div
                key={c._id}
                onClick={() => setSelectedClass(c)}
                className={`premium-card group cursor-pointer overflow-hidden border-slate-200 ${c.archived ? "opacity-80" : ""}`}
              >
                <div className="h-32 bg-slate-900 relative overflow-hidden flex items-end p-6">
                  {c.bannerUrl && (
                    <img
                      src={c.bannerUrl}
                      alt={c.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                  <div className="relative z-10 w-full">
                    <h3 className="text-xl font-bold text-white tracking-tight leading-tight group-hover:text-emerald-400 transition-colors">
                      {c.name}
                    </h3>
                    {(c.term || c.section) && (
                      <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-200 mt-1">
                        {[c.term, c.section].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-slate-500 font-medium line-clamp-2 h-10 text-sm leading-relaxed">
                    {c.description || "Project workspace • Ongoing session"}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${c.teacherId === user.email ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>
                        {c.teacherId === user.email ? "Teacher" : "Student"}
                      </span>
                      {c.archived && (
                        <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                          Archived
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.code}</div>
                  </div>

                  {user.role === "teacher" && c.teacherId === user.email && (
                    <div
                      className="flex items-center gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        disabled={isLoading}
                        onClick={() => {
                          void toggleArchive(c._id, !!c.archived);
                        }}
                        className="flex-1 px-2.5 py-2 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                      >
                        {c.archived ? <RotateCcw className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                        {c.archived ? "Restore" : "Archive"}
                      </button>
                      <button
                        disabled={isLoading}
                        onClick={() => {
                          void duplicateClass(c._id, c.name);
                        }}
                        className="flex-1 px-2.5 py-2 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3 h-3" /> Duplicate
                      </button>
                    </div>
                  )}
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
                onClick={() => {
                  void handleCreateClass();
                }}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-widest"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinClass && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-md p-8 max-w-xs w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Join Class</h3>
              <p className="text-slate-500 font-medium text-xs">Invite code for instant join or class code for teacher approval</p>
            </div>

            <input
              className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-md outline-none transition-all font-bold text-center text-2xl tracking-[0.15em] text-slate-700 placeholder:text-slate-200"
              placeholder="CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={12}
            />

            {joinMessage && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 text-center">{joinMessage}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowJoinClass(false)}
                className="flex-1 py-2.5 font-bold text-slate-400 hover:text-slate-600 transition-colors text-[11px] uppercase tracking-widest"
              >
                Close
              </button>
              <button
                onClick={() => {
                  void handleJoinClass();
                }}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold shadow-sm hover:bg-emerald-700 transition-all text-[11px] uppercase tracking-widest"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
