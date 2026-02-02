import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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
                    <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-bold italic">Competition hasn't started yet! Be the first to earn XP.</p>
                    </div>
                ) : (
                    leaderboard.map((u, idx) => (
                        <div
                            key={u._id}
                            className={`premium-card flex items-center gap-8 p-8 ${idx === 0
                                ? "ring-4 ring-pastel-blue/20 scale-105"
                                : ""
                                }`}
                        >
                            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl font-black text-xl shadow-inner ${idx === 0 ? "bg-pastel-blue text-white" : "bg-slate-50 text-slate-400"
                                }`}>
                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                            </div>

                            <img
                                src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=80&background=111827&color=ffffff&bold=true`}
                                alt={u.name}
                                className="w-20 h-20 rounded-3xl border-4 border-white shadow-xl"
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
                                <div className="text-3xl font-black text-slate-900 leading-none">{u.xp.toLocaleString()}</div>
                                <div className="text-[10px] font-black text-pastel-blue uppercase tracking-widest mt-2 px-3 py-1 bg-pastel-blue/10 rounded-full border border-pastel-blue/20">TOTAL XP</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
