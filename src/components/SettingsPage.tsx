import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { LogOut, ArrowLeft, User, Shield, Bell, Sparkles, Sun, Moon, Monitor, Link2, RefreshCw, CheckCircle2 } from "lucide-react";

interface SettingsPageProps {
  user: any;
  onBack: () => void;
  onSignOut: () => void;
  theme: "device" | "sun" | "moon";
  onThemeChange: (theme: "device" | "sun" | "moon") => void;
}

export function SettingsPage({
  user,
  onBack,
  onSignOut,
  theme,
  onThemeChange,
}: SettingsPageProps) {
  const featureApi = (api as any).featureFunctions;
  const serverPrefs = useQuery(featureApi.getNotificationPrefs, {});
  const notifications = useQuery(featureApi.getMyNotifications, {}) || [];
  const integrations = useQuery(featureApi.getIntegrationConnections, {}) || [];

  const updateNotificationPrefs = useMutation(featureApi.updateNotificationPrefs);
  const markNotificationRead = useMutation(featureApi.markNotificationRead);
  const markAllNotificationsRead = useMutation(featureApi.markAllNotificationsRead);
  const upsertIntegrationConnection = useMutation(featureApi.upsertIntegrationConnection);
  const triggerIntegrationSync = useMutation(featureApi.triggerIntegrationSync);

  const [optimisticPrefs, setOptimisticPrefs] = useState<Record<string, boolean>>({});
  const prefs = serverPrefs ? { ...serverPrefs, ...optimisticPrefs } : null;

  const savePrefs = async (patch: Record<string, boolean>) => {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setOptimisticPrefs((prev) => ({ ...prev, ...patch }));
    await updateNotificationPrefs({
      classAnnouncements: !!next.classAnnouncements,
      gradeUpdates: !!next.gradeUpdates,
      weeklySummary: !!next.weeklySummary,
      directMessages: !!next.directMessages,
      dueReminders: !!next.dueReminders,
    });
  };

  const getConnection = (provider: string) => integrations.find((item: any) => item.provider === provider);

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
            <div className="flex items-center justify-between text-sm font-medium text-slate-600">
              <span>Streak</span>
              <span className="text-slate-900 font-bold">{user.streak || 0} days</span>
            </div>
            <div className="flex items-center justify-between text-sm font-medium text-slate-600">
              <span>Level</span>
              <span className="text-slate-900 font-bold">{user.level || Math.max(1, Math.floor((user.xp || 0) / 100) + 1)}</span>
            </div>
          </div>
        </div>

        <div className="premium-card p-6 relative space-y-3">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Bell className="w-4 h-4" />
            <h3 className="text-sm font-bold">Notifications</h3>
          </div>
          {prefs ? (
            <div className="space-y-2 text-sm font-medium text-slate-600">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!prefs.classAnnouncements}
                  onChange={(e) => {
                    void savePrefs({ classAnnouncements: e.target.checked });
                  }}
                />
                Class announcements
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!prefs.gradeUpdates}
                  onChange={(e) => {
                    void savePrefs({ gradeUpdates: e.target.checked });
                  }}
                />
                Grade updates
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!prefs.dueReminders}
                  onChange={(e) => {
                    void savePrefs({ dueReminders: e.target.checked });
                  }}
                />
                Due reminders
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!prefs.directMessages}
                  onChange={(e) => {
                    void savePrefs({ directMessages: e.target.checked });
                  }}
                />
                Direct messages
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!prefs.weeklySummary}
                  onChange={(e) => {
                    void savePrefs({ weeklySummary: e.target.checked });
                  }}
                />
                Weekly summaries
              </label>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Loading preferences...</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <Bell className="w-4 h-4" />
              <h3 className="text-sm font-bold">Inbox</h3>
            </div>
            <button
              onClick={() => {
                void markAllNotificationsRead({});
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 border border-emerald-200 rounded-md px-2 py-1 hover:bg-emerald-50"
            >
              Mark all read
            </button>
          </div>
          <div className="space-y-2 max-h-[260px] overflow-auto">
            {notifications.length === 0 && (
              <p className="text-sm text-slate-400">No notifications yet.</p>
            )}
            {notifications.slice(0, 12).map((note: any) => (
              <div key={note._id} className={`rounded-md border px-3 py-2 ${note.read ? "border-slate-200 bg-slate-50" : "border-emerald-200 bg-emerald-50/50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900">{note.title}</p>
                  {!note.read && (
                    <button
                      onClick={() => {
                        void markNotificationRead({ notificationId: note._id, read: true });
                      }}
                      className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Read
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">{note.body}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mt-2">{new Date(note.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Link2 className="w-4 h-4" />
            <h3 className="text-sm font-bold">Integrations</h3>
          </div>
          {[
            { key: "google_classroom", label: "Google Classroom" },
            { key: "google_drive", label: "Google Drive" },
            { key: "canvas", label: "Canvas" },
          ].map((provider) => {
            const connection = getConnection(provider.key);
            const connected = connection?.status === "connected";
            return (
              <div key={provider.key} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{provider.label}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {connected ? `Connected${connection?.lastSyncAt ? ` • Last sync ${new Date(connection.lastSyncAt).toLocaleDateString()}` : ""}` : "Disconnected"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      void upsertIntegrationConnection({ provider: provider.key as any, status: connected ? "disconnected" : "connected" });
                    }}
                    className={`px-3 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${connected ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                  >
                    {connected ? "Disconnect" : "Connect"}
                  </button>
                </div>
                {connected && (
                  <button
                    onClick={() => {
                      void triggerIntegrationSync({ provider: provider.key as any });
                    }}
                    className="px-3 py-1.5 rounded-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-white inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" /> Sync now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="premium-card p-6">
        <div className="flex items-center gap-2 text-slate-600 mb-4">
          <Sparkles className="w-4 h-4" />
          <h3 className="text-sm font-bold">Appearance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => onThemeChange("device")}
            className={`px-4 py-3 rounded-md border font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${theme === "device" ? "border-slate-300 bg-slate-100 text-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Device
          </button>
          <button
            onClick={() => onThemeChange("sun")}
            className={`px-4 py-3 rounded-md border font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${theme === "sun" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <Sun className="w-3.5 h-3.5" />
            Sun (Light)
          </button>
          <button
            onClick={() => onThemeChange("moon")}
            className={`px-4 py-3 rounded-md border font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${theme === "moon" ? "border-slate-600 bg-slate-900 text-slate-200" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <Moon className="w-3.5 h-3.5" />
            Moon (Dark)
          </button>
        </div>
      </div>
    </div>
  );
}
