import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ClassDashboard } from "./components/ClassDashboard";

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

  if (user === undefined) return <LoadingScreen />;
  if (!user) return <LandingPage />;

  // role check for onboarding
  if (!user.role) return <OnboardingFlow user={user} />;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Premium Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl z-50 px-8 flex items-center justify-between soft-shadow border-b border-slate-100">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-900/20">E</div>
            <span className="text-xl font-black tracking-tight text-slate-900">EduOS</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              className="pill-tab pill-tab-active flex items-center gap-2"
            >
              <span>🏫</span>
              My Classes
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
            <span className="text-amber-500 font-bold">⚡ {user.xp || 0}</span>
          </div>

          <button
            onClick={() => signOut()}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            🚪
          </button>

          <img
            src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=111827&color=ffffff&bold=true`}
            className="w-10 h-10 rounded-full border-2 border-white shadow-md ring-1 ring-slate-100"
            alt={user.name}
          />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-6 min-h-screen">
        <div className="max-w-[1600px] mx-auto premium-container min-h-[calc(100vh-160px)] p-8">
          <ClassDashboard user={user} classes={classes || []} />
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen bg-bg-main flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-brand-primary rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl shadow-brand-primary/20 pulse-soft">
        🚀
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">EduOS</h2>
        <div className="flex gap-1 justify-center">
          <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce"></div>
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
    <div className="h-screen bg-bg-main flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 animate-in fade-in zoom-in-95 duration-700">
        <div
          className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col justify-center items-center text-center space-y-10 group hover:border-brand-primary transition-all cursor-pointer hover:-translate-y-2 relative overflow-hidden"
          onClick={() => handleRoleSelect("teacher")}
        >
          <div className="w-28 h-28 bg-brand-primary/5 rounded-[2.5rem] flex items-center justify-center text-6xl group-hover:scale-110 transition-transform shadow-inner">👨‍🏫</div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">I'm a Teacher</h2>
            <p className="text-slate-500 font-medium leading-relaxed">Manage classrooms, upload materials, and guide your students.</p>
          </div>
          <button className="bg-brand-primary text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 group-hover:bg-slate-800 transition-all">SELECT TEACHER</button>
        </div>

        <div
          className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col justify-center items-center text-center space-y-10 group hover:border-pastel-blue transition-all cursor-pointer hover:-translate-y-2 relative overflow-hidden"
          onClick={() => handleRoleSelect("student")}
        >
          <div className="w-28 h-28 bg-pastel-blue/5 rounded-[2.5rem] flex items-center justify-center text-6xl group-hover:scale-110 transition-transform shadow-inner">🎓</div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">I'm a Student</h2>
            <p className="text-slate-500 font-medium leading-relaxed">Join classes, complete lessons, and track your XP journey.</p>
          </div>
          <button className="bg-pastel-blue text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-pastel-blue/20 group-hover:bg-blue-600 transition-all">SELECT STUDENT</button>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const { signIn } = useAuthActions();
  return (
    <div className="min-h-screen bg-bg-main relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-pastel-blue/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pastel-red/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

      <div className="relative z-10 max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div className="inline-flex items-center gap-4 px-8 py-3.5 bg-white shadow-xl shadow-slate-200/50 rounded-full border border-slate-50">
          <span className="text-slate-900 font-black text-xs uppercase tracking-[0.3em]">EduOS Next-Gen</span>
          <div className="w-2 h-2 bg-pastel-green rounded-full animate-pulse shadow-[0_0_10px_#34D399]" />
        </div>

        <h1 className="text-7xl md:text-9xl font-black text-slate-900 leading-[0.85] tracking-tighter">
          Learning <br />
          <span className="gradient-text">Reimagined.</span>
        </h1>

        <p className="text-2xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          The premium platform for digital education. Beautiful, intuitive, and designed to inspire teachers and students alike.
        </p>

        <div className="pt-8">
          <button
            onClick={() => signIn("google")}
            className="px-12 py-6 bg-brand-primary text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-brand-primary/20 hover:scale-105 hover:bg-slate-800 transition-all transform duration-300 flex items-center gap-4 mx-auto"
          >
            <span>🚀</span> Get Started with Google
          </button>
          <p className="mt-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Secure Authentication via Google Account</p>
        </div>
      </div>

      {/* Visual Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-30">
        <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
        <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
        <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
      </div>
    </div>
  );
}
