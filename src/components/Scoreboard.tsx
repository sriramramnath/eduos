import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Trophy, Medal } from "lucide-react";
import { BookMascot } from "./BookMascot";

interface ScoreboardProps {
    classId?: Id<"classes">;
}

export function Scoreboard({ classId }: ScoreboardProps) {
    const leaderboard = useQuery(api.myFunctions.getLeaderboard, { classId }) || [];

    // Grouping by XP to handle ties properly
    const ranks: { xp: number; users: typeof leaderboard }[] = [];
    leaderboard.forEach(user => {
        const existingRank = ranks.find(r => r.xp === user.xp);
        if (existingRank) {
            existingRank.users.push(user);
        } else {
            ranks.push({ xp: user.xp, users: [user] });
        }
    });

    // Padded Podium logic: Ensure exactly 3 items for the podium
    const paddedRanks = [...ranks];
    while (paddedRanks.length < 3) {
        paddedRanks.push({ xp: -1, users: [] }); // Placeholder rank
    }

    const topThree = paddedRanks.slice(0, 3);
    const others = ranks.slice(3).flatMap(r => r.users);

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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">The Elite Circle • XP Champions</p>
            </div>

            <div className="space-y-12">
                {/* Top 3 Podium Section */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-end">
                    {topThree.map((rank, idx) => {
                        const isPlaceholder = rank.xp === -1;
                        // Map index to visually order: 2nd, 1st, 3rd on desktop
                        const orderClass = idx === 0 ? "md:order-2 md:scale-110" : idx === 1 ? "md:order-1" : "md:order-3";
                        const themeClass = idx === 0
                            ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-amber-200/20"
                            : idx === 1
                                ? "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200"
                                : "bg-gradient-to-br from-orange-50/30 to-amber-50/30 border-orange-100";

                        if (isPlaceholder) {
                            return (
                                <div
                                    key={`placeholder-${idx}`}
                                    className={`relative p-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/10 flex flex-col items-center justify-center min-h-[220px] transition-all duration-300 animate-in zoom-in-95 fade-in ${orderClass}`}
                                >
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                                        <RankIcon rank={idx} size={idx === 0 ? 6 : 5} />
                                    </div>
                                    <div className="mb-4">
                                        <BookMascot mood="happy" size={84} label="Pagey waiting for challengers" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-300 uppercase italic">?</h3>
                                    <div className="mt-3 inline-flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full border border-slate-100 shadow-sm opacity-50">
                                        <span className="text-lg font-black text-slate-300">0</span>
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">XP</span>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={rank.xp}
                                className={`relative p-6 rounded-3xl border-2 shadow-xl transition-all hover:translate-y-[-4px] duration-300 animate-in zoom-in-95 fade-in ${orderClass} ${themeClass}`}
                            >
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1 bg-white p-2 rounded-2xl shadow-md border border-slate-100">
                                    {rank.users.map(u => (
                                        <RankIcon key={u._id} rank={idx} size={idx === 0 ? 6 : 5} />
                                    ))}
                                </div>

                                <div className="mt-4 flex -space-x-4 justify-center">
                                    {rank.users.map(u => (
                                        <img
                                            key={u._id}
                                            src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=100&background=10b981&color=ffffff&bold=true`}
                                            alt={u.name}
                                            className={`rounded-2xl border-4 border-white shadow-lg object-cover ${idx === 0 ? 'w-24 h-24' : 'w-20 h-20'}`}
                                        />
                                    ))}
                                </div>

                                <div className="mt-6 text-center">
                                    <h3 className="text-sm font-black text-slate-900 line-clamp-2 uppercase tracking-tight">
                                        {rank.users.map(u => u.name).join(" & ")}
                                    </h3>
                                    <div className="mt-3 inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                        <span className="text-lg font-black text-slate-900">{rank.xp.toLocaleString()}</span>
                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">XP</span>
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
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Challengers Circle</p>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {others.map((u) => {
                                const actualRank = ranks.findIndex(r => r.xp === u.xp);
                                return (
                                    <div key={u._id} className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-slate-400">#{actualRank + 1}</span>
                                        </div>
                                        <img
                                            src={u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&size=80&background=10b981&color=ffffff&bold=true`}
                                            alt={u.name}
                                            className="w-10 h-10 rounded-xl border border-slate-200"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{u.name}</h4>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Rising Star</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-900 leading-none">{u.xp.toLocaleString()}</div>
                                            <div className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mt-1">XP</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
