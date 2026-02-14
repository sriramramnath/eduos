import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Flag, Send, ShieldAlert } from "lucide-react";
const EMPTY_ARRAY: any[] = [];

interface MessagesViewProps {
  classId: Id<"classes">;
  user: any;
}

export function MessagesView({ classId, user }: MessagesViewProps) {
  const members = useQuery(api.myFunctions.getClassMembers, { classId });
  const teacher = useQuery(api.myFunctions.getClassTeacher, { classId });

  const featureApi = (api as any).featureFunctions;
  const sendDirectMessage = useMutation(featureApi.sendDirectMessage);
  const moderateMessage = useMutation(featureApi.moderateMessage);

  const [selectedPeer, setSelectedPeer] = useState<string>("");
  const [draft, setDraft] = useState("");
  const membersList = members ?? EMPTY_ARRAY;

  const peers = useMemo(() => {
    const base = membersList.filter((member: any) => member.email !== user.email);
    if (teacher && teacher.email !== user.email) {
      return [teacher, ...base.filter((member: any) => member.email !== teacher.email)];
    }
    return base;
  }, [membersList, teacher, user.email]);

  const peerEmail = selectedPeer || peers[0]?.email || "";

  const messages = useQuery(
    featureApi.getDirectMessages,
    peerEmail ? { classId, peerEmail } : "skip"
  ) || [];

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !peerEmail) return;

    await sendDirectMessage({
      classId,
      recipientEmail: peerEmail,
      content,
    });
    setDraft("");
  };

  const flagMessage = async (messageId: string, currentlyFlagged: boolean) => {
    await moderateMessage({
      messageId,
      action: currentlyFlagged ? "unflag" : "flag",
      reason: currentlyFlagged ? "Cleared by teacher" : "Flagged by teacher",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Messages</h2>
        <p className="text-sm text-slate-500 font-medium">Secure class direct messaging with moderation controls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card p-4 space-y-2 lg:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conversations</p>
          <div className="space-y-1 max-h-[60vh] overflow-auto">
            {peers.map((peer: any) => (
              <button
                key={peer.email}
                onClick={() => setSelectedPeer(peer.email)}
                className={`w-full text-left px-3 py-2 rounded-md border text-sm font-bold transition-all ${peerEmail === peer.email ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {peer.name}
                <p className="text-[9px] font-medium uppercase tracking-widest text-slate-400 mt-0.5">{peer.email}</p>
              </button>
            ))}
            {peers.length === 0 && (
              <p className="text-xs text-slate-400 font-medium py-4">No peers available.</p>
            )}
          </div>
        </div>

        <div className="premium-card p-4 space-y-3 lg:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thread</p>

          <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
            {messages.length === 0 && (
              <p className="text-xs text-slate-400 font-medium py-8 text-center">No messages yet.</p>
            )}

            {messages.map((message: any) => {
              const mine = message.senderEmail === user.email;
              return (
                <div key={message._id} className={`rounded-md border px-3 py-2 ${mine ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{mine ? "You" : message.senderEmail.split("@")[0]}</p>
                    <div className="flex items-center gap-2">
                      {message.isFlagged && (
                        <span className="text-[8px] font-bold uppercase tracking-widest text-rose-600 inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Flagged
                        </span>
                      )}
                      {user.role === "teacher" && (
                        <button
                          onClick={() => {
                            void flagMessage(message._id, !!message.isFlagged);
                          }}
                          className="text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-rose-600 inline-flex items-center gap-1"
                        >
                          <Flag className="w-3 h-3" /> {message.isFlagged ? "Unflag" : "Flag"}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{message.content}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300 mt-2">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={peerEmail ? "Type a message" : "Select a conversation"}
              className="flex-1 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
            />
            <button
              onClick={() => {
                void sendMessage();
              }}
              disabled={!peerEmail || !draft.trim()}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
