// Sidebar.tsx
interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    user: any;
}

export function Sidebar({ activeTab, setActiveTab, user }: SidebarProps) {
    const menuItems = [
        { id: "files", label: "Files", icon: "📁" },
        { id: "path", label: "Learning Path", icon: "🛤️" },
        { id: "scoreboard", label: "Scoreboard", icon: "🏆" },
    ];

    return (
        <aside className="w-64 h-screen glass border-r border-slate-200 sticky top-0 flex flex-col p-6">
            <div className="mb-10">
                <h1 className="text-2xl font-bold gradient-text">EduOS</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wider">LEARNING PLATFORM</p>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === item.id
                            ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3 px-2">
                    <img
                        src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=40&background=6366f1&color=ffffff&bold=true`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-brand-primary/20"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
