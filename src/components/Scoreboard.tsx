import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Trophy, Medal } from "lucide-react";
import { BookMascot } from "./BookMascot";

interface ScoreboardProps {
    classId?: Id<"classes">;
    user?: any;
}

export function Scoreboard({ classId, user }: ScoreboardProps) {
    const leaderboard = useQuery(api.myFunctions.getLeaderboard, { classId }) || [];

    const topThree = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);
    const podiumOrder = [1, 0, 2];

    const RankIcon = ({ rank, size = 5 }: { rank: number; size?: number }) => {
        const className = `w-${size} h-${size}`;
        if (rank === 0) return <Trophy className={`${className} text-amber-500`} />;
        if (rank === 1) return <Medal className={`${className} text-slate-400`} />;
        if (rank === 2) return <Medal className={`${className} text-amber-700/60`} />;
        return <span className="text-[10px] font-black">#{rank + 1}</span>;
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-6 animate-in fade-in duration-700 text-left">
            <div className="mb-12 text-center relative">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">Leaderboard</h2>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">The Elite Circle • XP Champions</p>
            </div>

            <div className="space-y-12">
                <div className="md:hidden bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Leaderboard</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {leaderboard.map((u, idx) => {
                            const actualRank = idx + 1;
                            const isCurrentUser = u._id === user?._id;
                            return (
                                <div
                                    key={u._id}
                                    className={`flex items-center gap-4 p-4 transition-colors ${isCurrentUser ? "bg-emerald-50/50" : "hover:bg-slate-50/80"}`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[10px] font-black text-slate-500">#{actualRank}</span>
                                    </div>
                                    <img
                                        src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=80&background=10b981&color=ffffff&bold=true`}
                                        alt={u.name}
                                        className="w-10 h-10 rounded-xl border border-slate-200 object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{u.name}</h4>
                                    </div>
                                    <div className="text-right inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                                        <div className="text-sm font-black text-slate-900 leading-none">{u.xp.toLocaleString()}</div>
                                        <div className="text-[9px] font-semibold text-emerald-600 uppercase tracking-[0.08em]">XP</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="hidden md:block space-y-12">
                    {/* Top 3 Podium Section */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-end">
                        {podiumOrder.map((displayIndex) => {
                            const entry = topThree[displayIndex];
                            const isPlaceholder = !entry;
                            const orderClass = displayIndex === 0 ? "md:order-2 md:scale-110" : displayIndex === 1 ? "md:order-1" : "md:order-3";
                            const themeClass = displayIndex === 0
                                ? "leaderboard-podium-card-first bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-amber-200/20"
                                : displayIndex === 1
                                    ? "bg-white border-slate-200"
                                    : "bg-white border-slate-200";

                            if (isPlaceholder) {
                                return (
                                    <div
                                        key={`placeholder-${displayIndex}`}
                                        className={`relative p-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/10 flex flex-col items-center justify-center min-h-[220px] transition-all duration-300 animate-in zoom-in-95 fade-in ${orderClass}`}
                                    >
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                                            <RankIcon rank={displayIndex} size={displayIndex === 0 ? 6 : 5} />
                                        </div>
                                        <div className="mb-4">
                                            <BookMascot mood="happy" size={84} label="Pagey waiting for challengers" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-300 uppercase italic">?</h3>
                                        <div className="mt-3 inline-flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full border border-slate-100 shadow-sm opacity-50">
                                            <span className="text-lg font-black text-slate-300">0</span>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">XP</span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={entry._id}
                                    className={`relative p-6 rounded-3xl border-2 shadow-xl transition-all hover:translate-y-[-4px] duration-300 animate-in zoom-in-95 fade-in ${orderClass} ${themeClass}`}
                                >
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white px-2.5 py-2 rounded-2xl shadow-md border border-slate-100">
                                        <RankIcon rank={displayIndex} size={displayIndex === 0 ? 6 : 5} />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.08em]">#{displayIndex + 1}</span>
                                    </div>

                                    <div className="mt-4 flex justify-center">
                                        <img
                                            src={entry.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.name)}&size=120&background=10b981&color=ffffff&bold=true`}
                                            alt={entry.name}
                                            className={`rounded-2xl border-4 border-white shadow-lg object-cover ${displayIndex === 0 ? "w-24 h-24" : "w-20 h-20"}`}
                                        />
                                    </div>

                                    <div className="mt-6 text-center">
                                        <h3 className="text-sm font-black text-slate-900 line-clamp-2 uppercase tracking-tight">{entry.name}</h3>
                                        <div className="mt-3 inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                            <span className="text-lg font-black text-slate-900">{entry.xp.toLocaleString()}</span>
                                            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-[0.08em]">XP</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Remaining List Section */}
                    {others.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
                            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Ranks 4+</p>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {others.map((u, idx) => {
                                    const actualRank = idx + 4;
                                    const isCurrentUser = u._id === user?._id;
                                    return (
                                        <div
                                            key={u._id}
                                            className={`flex items-center gap-4 p-4 transition-colors ${isCurrentUser ? "bg-emerald-50/50" : "hover:bg-slate-50/80"}`}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-black text-slate-500">#{actualRank}</span>
                                            </div>
                                            <img
                                                src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=80&background=10b981&color=ffffff&bold=true`}
                                                alt={u.name}
                                                className="w-10 h-10 rounded-xl border border-slate-200 object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{u.name}</h4>
                                            </div>
                                            <div className="text-right inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                                                <div className="text-sm font-black text-slate-900 leading-none">{u.xp.toLocaleString()}</div>
                                                <div className="text-[9px] font-semibold text-emerald-600 uppercase tracking-[0.08em]">XP</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
