import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ClassDashboard } from "./components/ClassDashboard";
import { SettingsPage } from "./components/SettingsPage";
import { LogOut, Rocket, GraduationCap, Presentation } from "lucide-react";
import { BookMascot } from "./components/BookMascot";

export default function App() {
  return (
    <div className="min-h-screen bg-white relative">
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
  const [activePage, setActivePage] = useState<"dashboard" | "settings">("dashboard");
  const [theme, setTheme] = useState<"sun" | "moon">("sun");

  useEffect(() => {
    if (theme === "sun") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  if (user === undefined) return <LoadingScreen />;
  if (!user) return <LandingPage />;

  // role check for onboarding
  if (!user.role) return <OnboardingFlow user={user} />;

  return (
    <div className="flex flex-col min-h-screen bg-transparent overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Main Content Area */}
        <main className={`flex-1 overflow-auto scrollbar-hide ${selectedClass ? 'p-0' : 'p-6 md:p-12'}`}>
          <div className="max-w-7xl mx-auto min-h-full pb-20 md:pb-0">
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              {activePage === "settings" ? (
                <SettingsPage
                  user={user}
                  onBack={() => setActivePage("dashboard")}
                  onSignOut={() => signOut()}
                  theme={theme}
                  onThemeChange={setTheme}
                />
              ) : (
                <ClassDashboard
                  user={user}
                  classes={classes}
                  selectedClass={selectedClass}
                  setSelectedClass={setSelectedClass}
                  onOpenSettings={() => setActivePage("settings")}
                />
              )}
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
      <BookMascot mood="happy" size={96} label="Pagey loading" />
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
    <div className="h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
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
