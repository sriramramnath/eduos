import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Trophy, Medal } from "lucide-react";

interface ScoreboardProps {
    classId?: Id<"classes">;
}

export function Scoreboard({ classId }: ScoreboardProps) {
    const leaderboard = useQuery(api.myFunctions.getLeaderboard, { classId }) || [];

    return (
        <div className="max-w-2xl mx-auto py-10 px-6 animate-in fade-in duration-500 text-left">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Scoreboard</h2>
                <p className="text-sm text-slate-500 font-medium">Top performers in this workspace.</p>
            </div>

            <div className="space-y-6">
                {leaderboard.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium text-sm italic">Competition hasn't started yet! Be the first to earn XP.</p>
                    </div>
                ) : (
                    leaderboard.map((u, idx) => (
                        <div
                            key={u._id}
                            className={`premium-card flex items-center gap-5 p-4 ${idx === 0
                                ? "border-emerald-500/20 bg-emerald-500/5"
                                : ""
                                }`}
                        >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-md font-bold text-sm ${idx === 0 ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-50 text-slate-400"
                                }`}>
                                {idx === 0 ? <Trophy className="w-5 h-5" /> : idx === 1 ? <Medal className="w-5 h-5 text-slate-400" /> : idx === 2 ? <Medal className="w-5 h-5 text-amber-600/50" /> : <span className="text-xs">#{idx + 1}</span>}
                            </div>

                            <img
                                src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=80&background=10b981&color=ffffff&bold=true`}
                                alt={u.name}
                                className="w-12 h-12 rounded-md border border-slate-200"
                            />

                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-slate-900 truncate">
                                    {u.name}
                                </h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    Member since 2026
                                </p>
                            </div>

                            <div className="text-right">
                                <div className="text-xl font-bold text-slate-900 leading-none">{u.xp.toLocaleString()}</div>
                                <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1.5 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-100">XP</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
