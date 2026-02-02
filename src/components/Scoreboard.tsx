import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Scoreboard() {
    const leaderboard = useQuery(api.myFunctions.getLeaderboard) || [];

    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            <div className="mb-10 text-center">
                <h2 className="text-4xl font-black gradient-text mb-2">Hall of Fame</h2>
                <p className="text-slate-500 font-medium">Top explorers climbing the EduOS ranks.</p>
            </div>

            <div className="space-y-4">
                {leaderboard.length === 0 ? (
                    <div className="text-center py-20 glass rounded-3xl border-slate-200">
                        <p className="text-slate-400 font-medium italic">Competition hasn't started yet!</p>
                    </div>
                ) : (
                    leaderboard.map((u, idx) => (
                        <div
                            key={u._id}
                            className={`flex items-center gap-6 p-6 rounded-3xl transition-all duration-300 ${idx === 0
                                    ? "bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 shadow-xl shadow-amber-200/20 scale-105"
                                    : "bg-white border border-slate-200 shadow-sm hover:shadow-md"
                                }`}
                        >
                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 font-black text-xl text-slate-400">
                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                            </div>

                            <img
                                src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=80&background=6366f1&color=ffffff&bold=true`}
                                alt={u.name}
                                className="w-16 h-16 rounded-2xl border-4 border-white shadow-sm"
                            />

                            <div className="flex-1 min-w-0">
                                <h3 className={`text-lg font-bold truncate ${idx === 0 ? "text-amber-900" : "text-slate-900"}`}>
                                    {u.name}
                                </h3>
                                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                    Member Since 2026
                                </p>
                            </div>

                            <div className="text-right">
                                <div className="text-2xl font-black gradient-text">{u.xp.toLocaleString()}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL XP</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
