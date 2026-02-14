import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
    Send,
    Paperclip,
    GraduationCap,
    Loader2,
    Link as LinkIcon,
    Presentation,
    X,
    ClipboardList,
} from "lucide-react";
import { QuizCreator } from "./QuizCreator";

interface ComposerProps {
    classId: Id<"classes">;
    user: any;
}

type ComposeMode = "post" | "assignment";

export function Composer({ classId, user }: ComposerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [composeMode, setComposeMode] = useState<ComposeMode>("post");
    const [text, setText] = useState("");
    const [isPosting, setIsPosting] = useState(false);

    const [assignmentDueDate, setAssignmentDueDate] = useState("");
    const [assignmentError, setAssignmentError] = useState("");

    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkTitle, setLinkTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [linkIsWhiteboard, setLinkIsWhiteboard] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const postAnnouncement = useMutation(api.myFunctions.createAnnouncement);
    const generateUploadUrl = useMutation(api.myFunctions.generateUploadUrl);
    const uploadFile = useMutation(api.myFunctions.uploadFile);
    const createLink = useMutation(api.myFunctions.createLink);

    const resetAssignmentFields = () => {
        setAssignmentDueDate("");
        setAssignmentError("");
    };

    const collapseComposer = () => {
        setIsExpanded(false);
        setComposeMode("post");
        setText("");
        resetAssignmentFields();
    };

    const handlePost = async () => {
        if (!text.trim()) return;

        setIsPosting(true);
        try {
            await postAnnouncement({ classId, content: text.trim() });
            collapseComposer();
        } catch (err) {
            console.error(err);
        } finally {
            setIsPosting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isAssignmentUpload = composeMode === "assignment";
        const dueTimestamp = isAssignmentUpload && assignmentDueDate
            ? new Date(assignmentDueDate).getTime()
            : undefined;

        if (isAssignmentUpload && !dueTimestamp) {
            setAssignmentError("Set a due date before attaching a file.");
            return;
        }

        setIsPosting(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type || "application/octet-stream" },
                body: file,
            });
            if (!result.ok) {
                throw new Error("File upload failed");
            }

            const { storageId } = await result.json();

            await uploadFile({
                name: file.name,
                type: (file.type || "application/octet-stream").split("/")[0] || "application",
                mimeType: file.type || "application/octet-stream",
                size: file.size,
                storageId,
                classId,
                isAssignment: isAssignmentUpload,
                dueDate: dueTimestamp,
                instructions: isAssignmentUpload ? (text.trim() || undefined) : undefined,
                questionPrompts: isAssignmentUpload
                    ? text
                        .trim()
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                    : undefined,
            });
            collapseComposer();
        } catch (err) {
            console.error(err);
        } finally {
            setIsPosting(false);
        }
    };

    const handleAssignmentSubmit = async () => {
        const trimmedText = text.trim();
        const dueTimestamp = assignmentDueDate ? new Date(assignmentDueDate).getTime() : undefined;

        if (!dueTimestamp) {
            setAssignmentError("Set a due date.");
            return;
        }

        if (!trimmedText) {
            setAssignmentError("Add assignment instructions or questions.");
            return;
        }

        setAssignmentError("");
        setIsPosting(true);

        try {
            const textDocument = `Assignment\n\n${trimmedText}`;
            const textBlob = new Blob([textDocument], { type: "text/plain" });
            const dateStamp = new Date().toISOString().slice(0, 10);
            const uploadName = `assignment-${dateStamp}.txt`;
            const uploadMimeType = "text/plain";
            const uploadSize = textBlob.size;

            const postUrl = await generateUploadUrl();
            const uploadResult = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": uploadMimeType },
                body: textBlob,
            });
            if (!uploadResult.ok) {
                throw new Error("Assignment upload failed");
            }

            const { storageId } = await uploadResult.json();
            const questionPrompts = trimmedText
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean);

            await uploadFile({
                name: uploadName,
                type: uploadMimeType.split("/")[0] || "application",
                mimeType: uploadMimeType,
                size: uploadSize,
                storageId,
                classId,
                isAssignment: true,
                dueDate: dueTimestamp,
                instructions: trimmedText || undefined,
                questionPrompts: questionPrompts.length ? questionPrompts : undefined,
            });

            collapseComposer();
        } catch (err) {
            console.error(err);
            setAssignmentError("Could not create assignment. Try again.");
        } finally {
            setIsPosting(false);
        }
    };

    const handleSubmit = async () => {
        if (composeMode === "assignment") {
            await handleAssignmentSubmit();
            return;
        }
        await handlePost();
    };

    const createExcalidrawLink = () => {
        const room = Math.random().toString(36).slice(2, 10);
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let key = "";
        const bytes = new Uint8Array(22);
        window.crypto.getRandomValues(bytes);
        for (let i = 0; i < 22; i += 1) {
            key += chars[bytes[i] % chars.length];
        }
        return `https://excalidraw.com/#room=${room},${key}`;
    };

    const openLinkModal = (options?: { whiteboard?: boolean }) => {
        const isWhiteboard = options?.whiteboard ?? false;
        setLinkIsWhiteboard(isWhiteboard);
        setLinkTitle(isWhiteboard ? "New Excalidraw Whiteboard" : "");
        setLinkUrl(isWhiteboard ? createExcalidrawLink() : "");
        setIsLinkModalOpen(true);
    };

    const handleCreateLink = async () => {
        if (!linkTitle.trim() || !linkUrl.trim()) return;
        setIsPosting(true);
        try {
            await createLink({
                classId,
                title: linkTitle.trim(),
                url: linkUrl.trim(),
                isWhiteboard: linkIsWhiteboard || undefined,
            });
            setIsLinkModalOpen(false);
            collapseComposer();
            setLinkTitle("");
            setLinkUrl("");
            setLinkIsWhiteboard(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsPosting(false);
        }
    };

    if (user.role !== "teacher") return null;

    const canSubmit = composeMode === "post"
        ? !!text.trim()
        : !!assignmentDueDate && !!text.trim();

    return (
        <div className={`premium-container transition-all duration-300 ${isExpanded ? "p-6" : "p-4"} mb-8`}>
            {!isExpanded ? (
                <div
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center gap-4 cursor-pointer group"
                >
                    <img
                        src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=ffffff&bold=true`}
                        className="w-10 h-10 rounded-md border border-slate-200"
                        alt={user.name}
                    />
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-4 py-2 text-slate-400 font-medium text-sm group-hover:border-emerald-500/30 transition-all">
                        Post an update or assignment...
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <img
                                src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=ffffff&bold=true`}
                                className="w-8 h-8 rounded-md border border-slate-200"
                                alt={user.name}
                            />
                            <span className="text-sm font-bold text-slate-700">{user.name}</span>
                        </div>

                        <div className="relative grid grid-cols-2 w-full sm:w-60 p-1 rounded-md border border-slate-200 bg-slate-100">
                            <div
                                className="absolute top-1 bottom-1 rounded-md bg-white shadow-sm transition-all duration-300"
                                style={{
                                    left: composeMode === "post" ? "0.25rem" : "calc(50% + 0.125rem)",
                                    width: "calc(50% - 0.375rem)",
                                }}
                            />
                            <button
                                onClick={() => {
                                    setComposeMode("post");
                                    setAssignmentError("");
                                }}
                                className={`relative z-10 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${composeMode === "post" ? "text-slate-900" : "text-slate-500"
                                    }`}
                            >
                                Post
                            </button>
                            <button
                                onClick={() => {
                                    setComposeMode("assignment");
                                    setAssignmentError("");
                                }}
                                className={`relative z-10 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${composeMode === "assignment" ? "text-rose-600" : "text-slate-500"
                                    }`}
                            >
                                Assignment
                            </button>
                        </div>
                    </div>

                    <textarea
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            if (assignmentError) setAssignmentError("");
                        }}
                        placeholder={composeMode === "assignment" ? "Write assignment instructions or questions..." : "What's on your mind?"}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500/50 min-h-[120px] resize-none scrollbar-hide"
                        autoFocus
                    />

                    {composeMode === "assignment" && (
                        <div className="space-y-3 rounded-md border border-rose-100 bg-rose-50/40 p-3">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
                                <input
                                    type="datetime-local"
                                    value={assignmentDueDate}
                                    onChange={(e) => {
                                        setAssignmentDueDate(e.target.value);
                                        if (assignmentError) setAssignmentError("");
                                    }}
                                    className="w-full sm:w-72 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Students can upload response files or submit response links.
                            </p>
                            {assignmentError && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{assignmentError}</p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    void handleFileUpload(e);
                                }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 text-slate-600 transition-all border border-transparent hover:border-slate-200 font-bold text-[11px] uppercase tracking-wider"
                            >
                                <Paperclip className="w-4 h-4 text-emerald-500" />
                                File
                            </button>
                            <button
                                onClick={() => setIsQuizModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 text-slate-600 transition-all border border-transparent hover:border-slate-200 font-bold text-[11px] uppercase tracking-wider"
                            >
                                <GraduationCap className="w-4 h-4 text-emerald-500" />
                                Quiz
                            </button>
                            <button
                                onClick={() => openLinkModal()}
                                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 text-slate-600 transition-all border border-transparent hover:border-slate-200 font-bold text-[11px] uppercase tracking-wider"
                            >
                                <LinkIcon className="w-4 h-4 text-emerald-500" />
                                Link
                            </button>
                            <button
                                onClick={() => openLinkModal({ whiteboard: true })}
                                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 text-slate-600 transition-all border border-transparent hover:border-slate-200 font-bold text-[11px] uppercase tracking-wider"
                            >
                                <Presentation className="w-4 h-4 text-violet-500" />
                                Whiteboard
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={collapseComposer}
                                className="px-4 py-2 rounded-md text-slate-400 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    void handleSubmit();
                                }}
                                disabled={!canSubmit || isPosting}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-md font-bold text-[11px] uppercase tracking-wider shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                {isPosting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : composeMode === "assignment" ? (
                                    <ClipboardList className="w-3.5 h-3.5" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                                {isPosting ? (composeMode === "assignment" ? "Assigning..." : "Posting...") : composeMode === "assignment" ? "Assign" : "Post"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isQuizModalOpen && (
                <QuizCreator
                    classId={classId}
                    onClose={() => setIsQuizModalOpen(false)}
                    onSuccess={() => {
                        setIsQuizModalOpen(false);
                        setIsExpanded(false);
                    }}
                />
            )}

            {isLinkModalOpen && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{linkIsWhiteboard ? "Create Whiteboard" : "Attach Link"}</h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    {linkIsWhiteboard ? "Share a Maxboard whiteboard with your class." : "Share a link as a class resource."}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsLinkModalOpen(false)}
                                className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                                title="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                                <input
                                    value={linkTitle}
                                    onChange={(e) => setLinkTitle(e.target.value)}
                                    placeholder={linkIsWhiteboard ? "Chapter 5 Whiteboard" : "Resource Title"}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Link URL</label>
                                <input
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>
                            {linkIsWhiteboard && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    A unique Excalidraw room link is generated automatically.
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsLinkModalOpen(false)}
                                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    void handleCreateLink();
                                }}
                                disabled={!linkTitle.trim() || !linkUrl.trim() || isPosting}
                                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                {isPosting ? "Saving..." : "Share"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
