import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ClassDashboard } from "./components/ClassDashboard";
import { LogOut, Zap, Rocket, GraduationCap, Presentation } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Authenticated>
        <DashboardContent />
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </div>
  );
}


function DashboardContent() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.myFunctions.getCurrentUser);
  const classes = useQuery(api.myFunctions.getMyClasses) || [];
  const [selectedClass, setSelectedClass] = useState<any>(null);

  if (user === undefined) return <LoadingScreen />;
  if (!user) return <LandingPage />;

  // role check for onboarding
  if (!user.role) return <OnboardingFlow user={user} />;

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header - Minimalist Hub Branding */}
        <header className="h-14 flex items-center justify-between px-6 md:px-12 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-emerald-500 rounded-sm shadow-[0_0_12px_rgba(16,185,129,0.3)]"></div>
              <span className="font-black text-slate-900 tracking-tighter text-lg">EduOS</span>
            </div>
            {!selectedClass && (
              <>
                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:block">Class Hub</h2>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!selectedClass && (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm">
                <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                <span className="text-emerald-700 font-black text-[11px] tracking-tight">{user.xp || 0}</span>
              </div>
            )}

            <button
              onClick={() => signOut()}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400 hover:text-red-500 hover:border-red-100 group shadow-sm bg-white"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            </button>

            {!selectedClass && (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-black text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Now</p>
                </div>
                <img
                  src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=ffffff&bold=true`}
                  className="w-8 h-8 rounded-xl border-2 border-white shadow-lg ring-1 ring-slate-100"
                  alt={user.name}
                />
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-auto scrollbar-hide ${selectedClass ? 'p-0' : 'p-6 md:p-12'}`}>
          <div className="max-w-7xl mx-auto min-h-full pb-20 md:pb-0">
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <ClassDashboard
                user={user}
                classes={classes}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-emerald-600 rounded-md flex items-center justify-center text-white shadow-sm">
        <Rocket className="w-8 h-8" />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">EduOS</h2>
        <div className="flex gap-1 justify-center">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

function OnboardingFlow({ user }: { user: any }) {
  const setUserRole = useMutation(api.myFunctions.updateUserRole);

  console.log("Onboarding for:", user.email);

  const handleRoleSelect = async (role: "student" | "teacher") => {
    await setUserRole({ role });
  };

  return (
    <div className="h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
        <div
          className="bg-white p-10 rounded-md border border-slate-200 flex flex-col justify-center items-center text-center space-y-6 group hover:border-emerald-500 transition-all cursor-pointer relative"
          onClick={() => handleRoleSelect("teacher")}
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <Presentation className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">Manage classrooms and guide students.</p>
          </div>
          <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all">Select Role</button>
        </div>

        <div
          className="bg-white p-10 rounded-md border border-slate-200 flex flex-col justify-center items-center text-center space-y-6 group hover:border-emerald-500 transition-all cursor-pointer relative"
          onClick={() => handleRoleSelect("student")}
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">Join classes and complete paths.</p>
          </div>
          <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all">Select Role</button>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const { signIn } = useAuthActions();
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-white shadow-sm rounded-md border border-slate-200">
          <span className="text-slate-900 font-bold text-[10px] uppercase tracking-widest">EduOS Infrastructure</span>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_emerald]" />
        </div>

        <h1 className="text-6xl md:text-8xl font-bold text-slate-900 leading-[0.9] tracking-tighter">
          Education <br />
          <span className="text-emerald-600">Perfected.</span>
        </h1>

        <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
          The high-performance platform for digital classrooms. Fast, minimalist, and built for the modern educator.
        </p>

        <div className="pt-4">
          <button
            onClick={() => signIn("google")}
            className="px-8 py-4 bg-emerald-600 text-white rounded-md font-bold text-lg shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-3 mx-auto"
          >
            <Rocket className="w-6 h-6" /> Start with Google
          </button>
          <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Zero-configuration deployment</p>
        </div>
      </div>
    </div>
  );
}
