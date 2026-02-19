import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  ChevronLeft,
  CornerDownRight,
  MessageSquareMore,
  Search,
  SendHorizontal,
} from "lucide-react";

const EMPTY_ARRAY: any[] = [];

interface MessagesViewProps {
  classId: Id<"classes">;
  user: any;
  initialPeerEmail?: string;
}

function formatThreadTime(timestamp?: number) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isSameDay) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (isYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatMessageTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMessageDateHeader(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isSameDay) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatHeaderDateTime(timestamp?: number) {
  if (!timestamp) return "No messages yet";
  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getAvatarFallback(nameOrEmail: string) {
  return (nameOrEmail || "?").slice(0, 1).toUpperCase();
}

function getAvatarUrl(person: any) {
  const label = person?.name || person?.email || "User";
  return (
    person?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      label
    )}&background=10b981&color=ffffff&bold=true`
  );
}

export function MessagesView({ classId, user, initialPeerEmail }: MessagesViewProps) {
  const members = useQuery(api.myFunctions.getClassMembers, { classId });
  const teacher = useQuery(api.myFunctions.getClassTeacher, { classId });

  const featureApi = (api as any).featureFunctions;
  const sendDirectMessage = useMutation(featureApi.sendDirectMessage);

  const [selectedPeer, setSelectedPeer] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  useEffect(() => {
    if (!initialPeerEmail) return;
    setSelectedPeer(initialPeerEmail);
    setMobileThreadOpen(true);
  }, [initialPeerEmail]);

  const membersList = members ?? EMPTY_ARRAY;
  const threadSummaries =
    useQuery(featureApi.getDirectMessageThreads, {
      classId,
    }) || EMPTY_ARRAY;

  const peers = useMemo(() => {
    const base = membersList.filter((member: any) => member.email !== user.email);
    if (teacher && teacher.email !== user.email) {
      return [teacher, ...base.filter((member: any) => member.email !== teacher.email)];
    }
    return base;
  }, [membersList, teacher, user.email]);

  const threadMap = useMemo(() => {
    return new globalThis.Map<string, any>(
      threadSummaries.map((thread: any) => [thread.peerEmail, thread] as const)
    );
  }, [threadSummaries]);

  const peersWithMeta = useMemo(() => {
    const mapped = peers.map((peer: any) => {
      const thread = threadMap.get(peer.email);
      return {
        ...peer,
        thread,
        lastMessageAt: thread?.lastMessageAt ?? 0,
      };
    });

    return mapped.sort((a: any, b: any) => b.lastMessageAt - a.lastMessageAt);
  }, [peers, threadMap]);

  const filteredPeers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return peersWithMeta;
    return peersWithMeta.filter((peer: any) => {
      const name = (peer.name || "").toLowerCase();
      const email = (peer.email || "").toLowerCase();
      const preview = (peer.thread?.lastMessage || "").toLowerCase();
      return name.includes(q) || email.includes(q) || preview.includes(q);
    });
  }, [peersWithMeta, search]);

  const peerEmail =
    selectedPeer && filteredPeers.some((peer: any) => peer.email === selectedPeer)
      ? selectedPeer
      : filteredPeers[0]?.email || selectedPeer || peersWithMeta[0]?.email || "";

  const selectedPeerMeta = peersWithMeta.find((peer: any) => peer.email === peerEmail);

  const messages =
    useQuery(featureApi.getDirectMessages, peerEmail ? { classId, peerEmail } : "skip") ||
    EMPTY_ARRAY;

  const threadedMessages = useMemo(() => {
    const byParent = new globalThis.Map<string, any[]>();
    const roots: any[] = [];
    const sorted = [...messages].sort((a: any, b: any) => a.createdAt - b.createdAt);
    const idSet = new Set(sorted.map((message: any) => String(message._id)));

    for (const message of sorted) {
      if (!message.parentId || !idSet.has(String(message.parentId))) {
        roots.push(message);
        continue;
      }
      const key = String(message.parentId);
      byParent.set(key, [...(byParent.get(key) || []), message]);
    }

    return { roots, byParent };
  }, [messages]);

  const replyTargetMessage = messages.find((message: any) => message._id === replyToMessageId);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !peerEmail) return;

    await sendDirectMessage({
      classId,
      recipientEmail: peerEmail,
      content,
      parentId: replyToMessageId || undefined,
    });
    setDraft("");
    setReplyToMessageId(null);
  };

  const sendMessageFromKeyboard = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const MessageBubble = ({ message, nested = false }: { message: any; nested?: boolean }) => {
    const mine = message.senderEmail === user.email;
    const replies = threadedMessages.byParent.get(String(message._id)) || [];

    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[90%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
          <div
            className={`rounded-[20px] border px-4 py-3 leading-6 shadow-sm ${
              mine
                ? "bg-emerald-600 border-emerald-600 text-white rounded-br-[10px]"
                : "bg-white border-slate-200 text-slate-700 rounded-bl-[10px]"
            } ${nested ? "ring-1 ring-emerald-100" : ""}`}
          >
            <p className="text-sm md:text-[15px] whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="mt-1 px-1 inline-flex items-center gap-2">
            <p className="text-[11px] text-slate-500">{formatMessageTime(message.createdAt)}</p>
            <button
              onClick={() => setReplyToMessageId(String(message._id))}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <CornerDownRight className="h-3.5 w-3.5" />
              Reply
            </button>
          </div>

          {replies.length > 0 && (
            <div className={`mt-2 space-y-2 border-l-2 border-emerald-100 pl-3 ${mine ? "mr-2" : "ml-2"}`}>
              {replies.map((reply: any) => (
                <MessageBubble key={reply._id} message={reply} nested />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-3xl border border-slate-200 bg-white p-3 md:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-3 min-h-[calc(100dvh-12rem)] lg:min-h-[640px]">

            <aside
              className={`rounded-2xl border border-slate-200 bg-white p-2 md:p-3 flex-col overflow-hidden ${
                mobileThreadOpen ? "hidden lg:flex" : "flex"
              }`}
            >
              <div className="mb-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search"
                    className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50 px-10 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none"
                  />
                </div>
                <p className="text-2xl leading-none tracking-tight font-black text-slate-900 mt-4 px-1">
                  Messages
                </p>
              </div>

              <div className="flex-1 overflow-auto pr-1 space-y-1">
                {filteredPeers.map((peer: any) => {
                  const isActive = peer.email === peerEmail;
                  const preview = peer.thread?.lastMessage || "No messages yet";
                  const previewPrefix =
                    peer.thread?.lastSenderEmail === user.email ? "You: " : "";
                  const displayName = peer.name || peer.email.split("@")[0];

                  return (
                    <button
                      key={peer.email}
                      onClick={() => {
                        setSelectedPeer(peer.email);
                        setMobileThreadOpen(true);
                      }}
                      className={`w-full rounded-xl px-3 py-2.5 text-left border transition-all ${
                        isActive
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={getAvatarUrl(peer)}
                          alt={displayName}
                          className="h-10 w-10 rounded-full border border-slate-200 bg-white object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm leading-5 font-bold text-slate-900 truncate">
                              {displayName}
                            </p>
                            <p className="text-[11px] text-slate-500 shrink-0">
                              {formatThreadTime(peer.thread?.lastMessageAt)}
                            </p>
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500 truncate">
                            {previewPrefix}
                            {preview}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredPeers.length === 0 && (
                  <div className="px-3 py-8 text-center">
                    <p className="text-xs text-slate-400 font-semibold">No conversations found.</p>
                  </div>
                )}
              </div>
            </aside>

            <section
              className={`rounded-2xl border border-slate-200 bg-white overflow-hidden flex-col ${
                mobileThreadOpen ? "flex" : "hidden lg:flex"
              }`}
            >
              <header className="h-[84px] border-b border-slate-200 bg-white px-4 md:px-5 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileThreadOpen(false)}
                    className="lg:hidden h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 inline-flex items-center justify-center shrink-0"
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {selectedPeerMeta ? (
                    <img
                      src={getAvatarUrl(selectedPeerMeta)}
                      alt={selectedPeerMeta?.name || selectedPeerMeta?.email || "User"}
                      className="h-11 w-11 rounded-full border border-slate-200 bg-white object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 inline-flex items-center justify-center shrink-0">
                      {getAvatarFallback("?")}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-lg md:text-xl leading-6 font-bold text-slate-900 truncate">
                      {selectedPeerMeta?.name || selectedPeerMeta?.email || "Pick a conversation"}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {selectedPeerMeta
                        ? `Last activity ${formatHeaderDateTime(selectedPeerMeta.thread?.lastMessageAt)}`
                        : "Start a conversation"}
                    </p>
                  </div>
                </div>
                {selectedPeerMeta && (
                  <span className="text-[11px] font-semibold text-slate-500 rounded-full bg-white px-3 py-1 border border-slate-200">
                    {messages.length} messages
                  </span>
                )}
              </header>

              <div className="flex-1 overflow-auto p-3 md:p-4 space-y-2 bg-slate-50/30">
                {messages.length === 0 && (
                  <div className="h-full min-h-[220px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-3 h-10 w-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500">
                        <MessageSquareMore className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">No messages yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Start this conversation with a quick hello.
                      </p>
                    </div>
                  </div>
                )}

                {threadedMessages.roots.map((message: any, index: number) => {
                  const showDateDivider =
                    index === 0 ||
                    new Date(threadedMessages.roots[index - 1].createdAt).toDateString() !==
                      new Date(message.createdAt).toDateString();

                  return (
                    <div key={message._id}>
                      {showDateDivider && (
                        <div className="my-3 flex items-center gap-2">
                          <div className="h-px flex-1 bg-slate-200" />
                          <p className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {formatMessageDateHeader(message.createdAt)}
                          </p>
                          <div className="h-px flex-1 bg-slate-200" />
                        </div>
                      )}

                      <MessageBubble message={message} />
                    </div>
                  );
                })}
              </div>

              <footer className="border-t border-slate-200 bg-slate-50 p-3 md:p-4">
                {replyTargetMessage && (
                  <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-emerald-700 truncate">
                      Replying to <span className="font-semibold">{replyTargetMessage.senderEmail === user.email ? "your message" : selectedPeerMeta?.name || selectedPeerMeta?.email || "message"}</span>
                    </p>
                    <button
                      onClick={() => setReplyToMessageId(null)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={sendMessageFromKeyboard}
                    placeholder={peerEmail ? (replyToMessageId ? "Write a reply" : "Write a message") : "Select a conversation first"}
                    rows={1}
                    className="flex-1 min-h-[42px] max-h-32 px-2 py-2 rounded-lg bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none resize-y"
                  />
                  <button
                    onClick={() => {
                      void sendMessage();
                    }}
                    disabled={!peerEmail || !draft.trim()}
                    className="h-11 w-11 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center disabled:opacity-50 hover:bg-emerald-700 transition-colors"
                    aria-label="Send message"
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] font-medium text-slate-400 mt-2 px-1">
                  Press Enter to send. Use Shift + Enter for a new line.
                </p>
              </footer>
            </section>
          </div>
        </div>
    </div>
  );
}
