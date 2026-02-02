"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import * as React from "react";
import { api } from "../convex/_generated/api";
import { ClassDashboard } from "./components/ClassDashboard";
import { Onboarding } from "./components/Onboarding";
import { Sidebar } from "./components/Sidebar";
import { LearningPath } from "./components/LearningPath";
import { Scoreboard } from "./components/Scoreboard";

export default function App() {
  const user = useQuery(api.myFunctions.getCurrentUser);
  const identity = useQuery(api.myFunctions.getAuthenticatedUser);

  if (user === undefined || identity === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!identity) {
    return <Registration />;
  }

  if (!user) {
    return <AutoRegister identity={identity} />;
  }

  if (!user.role) {
    return <RoleOnboarding user={user} />;
  }

  return <Dashboard user={user} />;
}

function RoleOnboarding({ user }: { user: any }) {
  const updateUserRole = useMutation(api.myFunctions.updateUserRole);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleSelection = async () => {
    try {
      setIsUpdating(true);
      await updateUserRole({ role });
    } catch (error) {
      console.error("Role update failed:", error);
      setIsUpdating(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="glass max-w-lg w-full p-10 rounded-[2.5rem] shadow-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-2">Welcome, {user.name.split(' ')[0]}!</h1>
          <p className="text-slate-500 font-medium">Choose your path to begin your journey.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest ml-1">Profile Role</label>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setRole("student")}
              className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all text-left ${role === "student" ? "bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/30" : "bg-white/50 border-slate-200 text-slate-600 hover:border-brand-primary/30"
                }`}
            >
              <span className="text-3xl">🎓</span>
              <div>
                <div className="font-black text-lg">Student</div>
                <div className={`text-sm ${role === "student" ? "text-white/80" : "text-slate-400"}`}>Discover, learn, and earn XP.</div>
              </div>
            </button>

            <button
              onClick={() => setRole("teacher")}
              className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all text-left ${role === "teacher" ? "bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/30" : "bg-white/50 border-slate-200 text-slate-600 hover:border-brand-primary/30"
                }`}
            >
              <span className="text-3xl">🍎</span>
              <div>
                <div className="font-black text-lg">Teacher</div>
                <div className={`text-sm ${role === "teacher" ? "text-white/80" : "text-slate-400"}`}>Guide, inspire, and manage units.</div>
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handleRoleSelection}
          disabled={isUpdating}
          className="w-full gradient-bg text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 transform hover:-translate-y-1 active:translate-y-0"
        >
          {isUpdating ? "PREPARING..." : "ENTER EDUOS"}
        </button>
      </div>
    </main>
  );
}

function AutoRegister({ identity }: { identity: any }) {
  const registerUser = useMutation(api.myFunctions.autoRegisterUser);

  React.useEffect(() => {
    registerUser({ name: identity.name || "User" });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-400 font-bold tracking-widest animate-pulse">SETTING UP ACCOUNT...</div>
    </div>
  );
}

function Registration() {
  const { signIn } = useAuthActions();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn("google");
    } catch (error) {
      console.error("Sign in failed:", error);
      setIsSigningIn(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="glass max-w-sm w-full p-12 rounded-[3rem] shadow-2xl text-center space-y-10">
        <div>
          <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">EduOS</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Version 2.0</p>
        </div>

        <div className="space-y-6">
          <div className="w-24 h-24 gradient-bg rounded-3xl mx-auto flex items-center justify-center shadow-xl rotate-3">
            <span className="text-4xl">🚀</span>
          </div>
          <p className="text-slate-600 font-medium px-4 leading-relaxed">
            The next generation of file-native gamified learning.
          </p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full bg-white text-slate-900 border-2 border-slate-100 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:border-brand-primary/20 transition-all disabled:opacity-50"
        >
          {isSigningIn ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-primary border-t-transparent"></div>
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Sign in with Google
            </>
          )}
        </button>
      </div>
    </main>
  );
}

function Dashboard({ user }: { user: any }) {
  const classes = useQuery(api.myFunctions.getMyClasses) || [];
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState("path");

  if (showOnboarding) {
    return (
      <Onboarding
        user={user}
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

      <main className="flex-1 p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h2>
            <p className="text-slate-500 font-medium">Welcome back, {user.name.split(' ')[0]}!</p>
          </div>

          <div className="flex items-center gap-6 glass px-6 py-3 rounded-2xl shadow-sm border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <span className="text-lg font-black gradient-text">{(user.xp || 0).toLocaleString()}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">XP</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-lg font-black text-orange-500">3</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">DAY STREAK</span>
            </div>
          </div>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "files" && <ClassDashboard user={user} classes={classes} />}
          {activeTab === "path" && <LearningPath user={user} />}
          {activeTab === "scoreboard" && <Scoreboard />}
        </section>
      </main>
    </div>
  );
}
