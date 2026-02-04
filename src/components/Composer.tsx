import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Send, Paperclip, GraduationCap, Loader2 } from "lucide-react";
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const postAnnouncement = useMutation(api.myFunctions.createAnnouncement);
    const generateUploadUrl = useMutation(api.myFunctions.generateUploadUrl);
    const uploadFile = useMutation(api.myFunctions.uploadFile);

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
                                onChange={handleFileUpload}
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
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="px-4 py-2 rounded-md text-slate-400 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePost}
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
        </div>
    );
}
