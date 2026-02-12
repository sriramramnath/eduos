import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Send, Paperclip, GraduationCap, Loader2, Link as LinkIcon, Presentation, X, ClipboardList, Upload } from "lucide-react";
import { QuizCreator } from "./QuizCreator";

interface ComposerProps {
    classId: Id<"classes">;
    user: any;
}

export function Composer({ classId, user }: ComposerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [text, setText] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkTitle, setLinkTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [linkIsWhiteboard, setLinkIsWhiteboard] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [assignmentTitle, setAssignmentTitle] = useState("");
    const [assignmentType, setAssignmentType] = useState<"doc" | "text" | "both">("both");
    const [assignmentDueDate, setAssignmentDueDate] = useState("");
    const [assignmentInstructions, setAssignmentInstructions] = useState("");
    const [assignmentQuestions, setAssignmentQuestions] = useState("");
    const [assignmentFile, setAssignmentFile] = useState<globalThis.File | null>(null);
    const [assignmentError, setAssignmentError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const assignmentFileInputRef = useRef<HTMLInputElement>(null);

    const postAnnouncement = useMutation(api.myFunctions.createAnnouncement);
    const generateUploadUrl = useMutation(api.myFunctions.generateUploadUrl);
    const uploadFile = useMutation(api.myFunctions.uploadFile);
    const createLink = useMutation(api.myFunctions.createLink);

    const handlePost = async () => {
        if (!text.trim()) return;
        setIsPosting(true);
        try {
            await postAnnouncement({ classId, content: text });
            setText("");
            setIsExpanded(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsPosting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsPosting(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            await uploadFile({
                name: file.name,
                type: file.type.split("/")[0],
                mimeType: file.type,
                size: file.size,
                storageId,
                classId,
                isAssignment: false,
            });
            setIsExpanded(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsPosting(false);
        }
    };

    const resetAssignmentForm = () => {
        setAssignmentTitle("");
        setAssignmentType("both");
        setAssignmentDueDate("");
        setAssignmentInstructions("");
        setAssignmentQuestions("");
        setAssignmentFile(null);
        setAssignmentError("");
        if (assignmentFileInputRef.current) {
            assignmentFileInputRef.current.value = "";
        }
    };

    const handleCreateAssignment = async () => {
        const title = assignmentTitle.trim();
        const dueTimestamp = assignmentDueDate ? new Date(assignmentDueDate).getTime() : undefined;
        const instructions = assignmentInstructions.trim();
        const questionPrompts = assignmentQuestions
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
        const hasTextContent = instructions.length > 0 || questionPrompts.length > 0;

        if (!title) {
            setAssignmentError("Add an assignment title.");
            return;
        }
        if (!dueTimestamp) {
            setAssignmentError("Set a due date.");
            return;
        }
        if (assignmentType === "doc" && !assignmentFile) {
            setAssignmentError("Upload a question document.");
            return;
        }
        if (assignmentType === "text" && !hasTextContent) {
            setAssignmentError("Add instructions or questions.");
            return;
        }
        if (assignmentType === "both" && (!assignmentFile || !hasTextContent)) {
            setAssignmentError("Both file and text are required for this type.");
            return;
        }

        setAssignmentError("");
        setIsPosting(true);

        try {
            let uploadName = "";
            let uploadMimeType = "";
            let uploadSize = 0;
            let uploadBody: Blob | globalThis.File;

            if (assignmentFile) {
                const extension = assignmentFile.name.includes(".")
                    ? assignmentFile.name.slice(assignmentFile.name.lastIndexOf("."))
                    : "";
                uploadName = extension ? `${title}${extension}` : title;
                uploadMimeType = assignmentFile.type || "application/octet-stream";
                uploadSize = assignmentFile.size;
                uploadBody = assignmentFile;
            } else {
                const textDocument = [
                    `Assignment: ${title}`,
                    "",
                    instructions ? `Instructions:\n${instructions}` : "",
                    questionPrompts.length ? `Questions:\n${questionPrompts.map((q, i) => `${i + 1}. ${q}`).join("\n")}` : "",
                ]
                    .filter(Boolean)
                    .join("\n\n");
                const textBlob = new Blob([textDocument], { type: "text/plain" });
                uploadName = `${title}.txt`;
                uploadMimeType = "text/plain";
                uploadSize = textBlob.size;
                uploadBody = textBlob;
            }

            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": uploadMimeType },
                body: uploadBody,
            });
            if (!result.ok) {
                throw new Error("Assignment upload failed");
            }
            const { storageId } = await result.json();

            await uploadFile({
                name: uploadName,
                type: uploadMimeType.split("/")[0] || "application",
                mimeType: uploadMimeType,
                size: uploadSize,
                storageId,
                classId,
                isAssignment: true,
                dueDate: dueTimestamp,
                instructions: instructions || undefined,
                questionPrompts: questionPrompts.length ? questionPrompts : undefined,
            });

            setIsAssignmentModalOpen(false);
            setIsExpanded(false);
            resetAssignmentForm();
        } catch (err) {
            console.error(err);
            setAssignmentError("Could not create assignment. Try again.");
        } finally {
            setIsPosting(false);
        }
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
            setIsExpanded(false);
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
                        Announce something to your class...
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 mb-2">
                        <img
                            src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=ffffff&bold=true`}
                            className="w-8 h-8 rounded-md border border-slate-200"
                            alt={user.name}
                        />
                        <span className="text-sm font-bold text-slate-700">{user.name}</span>
                    </div>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500/50 min-h-[120px] resize-none scrollbar-hide"
                        autoFocus
                    />

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
                                onClick={() => setIsAssignmentModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 text-slate-600 transition-all border border-transparent hover:border-slate-200 font-bold text-[11px] uppercase tracking-wider"
                            >
                                <ClipboardList className="w-4 h-4 text-rose-500" />
                                Assignment
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
                                onClick={() => setIsExpanded(false)}
                                className="px-4 py-2 rounded-md text-slate-400 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    void handlePost();
                                }}
                                disabled={!text.trim() || isPosting}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-md font-bold text-[11px] uppercase tracking-wider shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Post
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

            {isAssignmentModalOpen && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Create Assignment</h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Choose doc, text, or both. Students can submit uploads or links.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsAssignmentModalOpen(false);
                                    resetAssignmentForm();
                                }}
                                className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                                title="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                                <input
                                    value={assignmentTitle}
                                    onChange={(e) => setAssignmentTitle(e.target.value)}
                                    placeholder="Homework 5 - Fractions"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</label>
                                <input
                                    type="datetime-local"
                                    value={assignmentDueDate}
                                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assignment Type</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: "doc", label: "Question Doc" },
                                    { id: "text", label: "Question Text" },
                                    { id: "both", label: "Both" },
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setAssignmentType(option.id as "doc" | "text" | "both")}
                                        className={`px-3 py-2 rounded-md border text-[10px] font-bold uppercase tracking-widest transition-all ${assignmentType === option.id
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(assignmentType === "text" || assignmentType === "both") && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instructions</label>
                                    <textarea
                                        value={assignmentInstructions}
                                        onChange={(e) => setAssignmentInstructions(e.target.value)}
                                        placeholder="Explain what students should do."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500/50 min-h-[90px] resize-y"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Questions (one per line)</label>
                                    <textarea
                                        value={assignmentQuestions}
                                        onChange={(e) => setAssignmentQuestions(e.target.value)}
                                        placeholder={"Solve #1 to #5\nExplain your reasoning in 3 sentences"}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500/50 min-h-[90px] resize-y"
                                    />
                                </div>
                            </div>
                        )}

                        {(assignmentType === "doc" || assignmentType === "both") && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Document</label>
                                <input
                                    type="file"
                                    ref={assignmentFileInputRef}
                                    onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => assignmentFileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    {assignmentFile ? "Change File" : "Upload Doc"}
                                </button>
                                {assignmentFile && (
                                    <p className="text-xs text-slate-500 font-medium">{assignmentFile.name}</p>
                                )}
                            </div>
                        )}

                        {assignmentError && (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{assignmentError}</p>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setIsAssignmentModalOpen(false);
                                    resetAssignmentForm();
                                }}
                                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    void handleCreateAssignment();
                                }}
                                disabled={isPosting}
                                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-md font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                {isPosting ? "Creating..." : "Create Assignment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
