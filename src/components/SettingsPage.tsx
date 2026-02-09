import { LogOut, ArrowLeft, User, Shield, Bell, Sparkles } from "lucide-react";

interface SettingsPageProps {
  user: any;
  onBack: () => void;
  onSignOut: () => void;
  theme: "sun" | "moon";
  onThemeChange: (theme: "sun" | "moon") => void;
}

export function SettingsPage({ user, onBack, onSignOut, theme, onThemeChange }: SettingsPageProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all bg-white"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Settings</h1>
            <p className="text-sm text-slate-500 font-medium">Manage your account and preferences.</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="px-4 py-2 rounded-md border border-rose-200 font-bold text-[11px] uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card p-6 relative">
          <div className="flex items-center gap-2 text-slate-600 mb-4">
            <User className="w-4 h-4" />
            <h3 className="text-sm font-bold">Profile</h3>
          </div>
          <div className="flex items-center gap-4">
            <img
              src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=ffffff&bold=true`}
              className="w-12 h-12 rounded-xl border border-slate-200 shadow-sm"
              alt={user.name}
            />
            <div>
              <p className="text-base font-bold text-slate-900">{user.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="premium-card p-6 relative">
          <div className="flex items-center gap-2 text-slate-600 mb-4">
            <Shield className="w-4 h-4" />
            <h3 className="text-sm font-bold">Account</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-medium text-slate-600">
              <span>Role</span>
              <span className="text-slate-900 font-bold">{user.role || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-medium text-slate-600">
              <span>XP</span>
              <span className="text-emerald-600 font-bold">{user.xp || 0}</span>
            </div>
          </div>
        </div>

        <div className="premium-card p-6 relative">
          <div className="flex items-center gap-2 text-slate-600 mb-4">
            <Bell className="w-4 h-4" />
            <h3 className="text-sm font-bold">Notifications</h3>
          </div>
          <div className="space-y-3 text-sm font-medium text-slate-600">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Class announcements
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Grade updates
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              Weekly summaries
            </label>
          </div>
        </div>
      </div>

      <div className="premium-card p-6">
        <div className="flex items-center gap-2 text-slate-600 mb-4">
          <Sparkles className="w-4 h-4" />
          <h3 className="text-sm font-bold">Appearance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => onThemeChange("sun")}
            className={`px-4 py-3 rounded-md border font-bold text-[11px] uppercase tracking-widest transition-all ${theme === "sun" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            Sun (Light)
          </button>
          <button
            onClick={() => onThemeChange("moon")}
            className={`px-4 py-3 rounded-md border font-bold text-[11px] uppercase tracking-widest transition-all ${theme === "moon" ? "border-slate-600 bg-slate-900 text-slate-200" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            Moon (Dark)
          </button>
        </div>
      </div>
    </div>
  );
}
