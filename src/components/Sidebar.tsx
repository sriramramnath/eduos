import { Home, Folder, Trophy, School, Settings, ChevronLeft, ChevronRight, LogOut, Zap } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    user: any;
    isCollapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ activeTab, setActiveTab, user, isCollapsed, onToggle }: SidebarProps) {
    const { signOut } = useAuthActions();
    const menuItems = [
        { id: "home", label: "Home", icon: <Home className="w-4 h-4" /> },
        { id: "classes", label: "Classes", icon: <School className="w-4 h-4" /> },
        { id: "files", label: "Files", icon: <Folder className="w-4 h-4" /> },
        { id: "scoreboard", label: "Scoreboard", icon: <Trophy className="w-4 h-4" /> },
    ];

    return (
        <aside
            className={`${isCollapsed ? "w-20" : "w-64"} h-screen bg-slate-50/50 border-r border-slate-200 sticky top-0 flex flex-col p-5 transition-all duration-300 ease-in-out z-[60]`}
        >
            <div className={`mb-8 flex flex-col ${isCollapsed ? "items-center" : "px-2"}`}>
                <div className="flex items-center justify-between w-full mb-4">
                    {!isCollapsed && (
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 animate-in fade-in duration-300">
                            <div className="w-2 h-6 bg-emerald-500 rounded-sm"></div>
                            EduOS
                        </h1>
                    )}
                    <button
                        onClick={onToggle}
                        className="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-emerald-600 transition-all shadow-sm"
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                {/* XP Display Mini */}
                <div className={`flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-md shadow-sm w-full ${isCollapsed ? "justify-center px-0" : ""}`}>
                    <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 shrink-0" />
                    {!isCollapsed && (
                        <div className="flex flex-col animate-in fade-in duration-300 overflow-hidden">
                            <span className="text-[10px] font-black text-slate-700 leading-none">{user.xp || 0} XP</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Growth Status</span>
                        </div>
                    )}
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-bold transition-all ${activeTab === item.id
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            } ${isCollapsed ? "justify-center" : ""}`}
                        title={isCollapsed ? item.label : ""}
                    >
                        <div className="shrink-0">{item.icon}</div>
                        {!isCollapsed && <span className="truncate animate-in fade-in duration-300">{item.label}</span>}
                    </button>
                ))}
            </nav>

            <div className="space-y-1 mb-4 border-t border-slate-200 pt-4">
                <button
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-bold text-slate-500 hover:bg-slate-100 transition-all ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? "Settings" : ""}
                >
                    <Settings className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">Settings</span>}
                </button>

                <button
                    onClick={() => signOut()}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-bold text-rose-500 hover:bg-rose-50 transition-all ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? "Sign Out" : ""}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">Sign Out</span>}
                </button>
            </div>

            <div className="pt-5 border-t border-slate-200">
                <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "px-2"} group cursor-pointer relative`}>
                    <img
                        src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=ffffff&bold=true`}
                        alt={user.name}
                        className="w-9 h-9 rounded-md border border-slate-200 shadow-sm shrink-0"
                    />
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                            <p className="text-[12px] font-bold text-slate-900 truncate">{user.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.role}</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
