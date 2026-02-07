import { useState } from "react";
import { Doc } from "../../convex/_generated/dataModel";
import { ExternalLink, Link as LinkIcon, Presentation } from "lucide-react";

interface LinkGridProps {
  links: Doc<"links">[];
}

export function LinkGrid({ links }: LinkGridProps) {
  const [openingId, setOpeningId] = useState<string | null>(null);

  if (links.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {links.map((link) => (
        <button
          key={link._id}
          onClick={() => {
            setOpeningId(link._id);
            window.open(link.url, "_blank");
            setTimeout(() => setOpeningId(null), 400);
          }}
          className="premium-card p-4 flex flex-col text-left group cursor-pointer hover:border-emerald-500/40 relative"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center border transition-all ${link.isWhiteboard ? "bg-violet-50 text-violet-600 border-violet-100 group-hover:bg-violet-600 group-hover:text-white" : "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white"}`}>
              {link.isWhiteboard ? <Presentation className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate tracking-tight group-hover:text-emerald-600 transition-colors">{link.title}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {link.isWhiteboard ? "Whiteboard" : "Link"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              {new Date(link._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">
              {openingId === link._id ? "Opening" : "Open"}
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
