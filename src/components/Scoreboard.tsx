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
        <div className="max-w-3xl mx-auto py-12 px-6">
            <div className="mb-12 text-center">
                <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-2">Hall of Fame</h2>
                <p className="text-slate-500 font-medium italic">Top performers climbing the EduOS ranks.</p>
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
                            className={`premium-card flex items-center gap-6 p-6 ${idx === 0
                                ? "border-brand-primary/20 bg-brand-primary/[0.02]"
                                : ""
                                }`}
                        >
                            <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg ${idx === 0 ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "bg-slate-50 text-slate-400"
                                }`}>
                                {idx === 0 ? <Trophy className="w-6 h-6" /> : idx === 1 ? <Medal className="w-6 h-6 text-slate-400" /> : idx === 2 ? <Medal className="w-6 h-6 text-amber-600/50" /> : <span className="text-sm">#{idx + 1}</span>}
                            </div>

                            <img
                                src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=80&background=f1f5f9&color=64748b&bold=true`}
                                alt={u.name}
                                className="w-16 h-16 rounded-xl border-2 border-white shadow-md"
                            />

                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-black text-slate-900 truncate">
                                    {u.name}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                                    Member since 2026
                                </p>
                            </div>

                            <div className="text-right">
                                <div className="text-2xl font-black text-slate-900 leading-none">{u.xp.toLocaleString()}</div>
                                <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mt-2 px-3 py-1 bg-brand-primary/5 rounded-lg border border-brand-primary/10">TOTAL XP</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
