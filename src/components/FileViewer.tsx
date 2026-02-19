import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { X, Download, Image as ImageIcon, File as FileIcon, Globe, Layout, Edit3, Presentation, ExternalLink, Link2, Upload, Loader2, MessageSquare, Save, CornerDownRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import WebViewer from "@pdftron/webviewer";

interface FileViewerProps {
  file: Doc<"files">;
  onClose: () => void;
  userRole: string;
}

export function FileViewer({ file, onClose, userRole }: FileViewerProps) {
  const viewer = useRef<HTMLDivElement>(null);
  const fileUrl = useQuery(api.myFunctions.getFileUrl, { storageId: file.storageId });
  const submissions = useQuery(api.myFunctions.getAssignmentSubmissions, file.isAssignment && userRole !== "student" ? { assignmentId: file._id } : "skip") || [];
  const featureApi = (api as any).featureFunctions;
  const fileComments = useQuery(featureApi.getFileComments, file.isAssignment ? { fileId: file._id, classId: file.classId } : "skip") || [];
  const generateUploadUrl = useMutation(api.myFunctions.generateUploadUrl);
  const submitAssignment = useMutation(api.myFunctions.submitAssignment);
  const addFileComment = useMutation(featureApi.addFileComment);
  const gradeAssignmentSubmission = useMutation(featureApi.gradeAssignmentSubmission);
  const [isViewerLoading, setIsViewerLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTarget, setImportTarget] = useState<"google" | "canva" | null>(null);
  const [submissionFile, setSubmissionFile] = useState<globalThis.File | null>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [showSubmission, setShowSubmission] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { score: string; feedback: string }>>({});
  const questionPrompts = file.questionPrompts || [];

  const isOfficeDoc = (
    file.mimeType.includes("pdf") ||
    file.mimeType.includes("word") ||
    file.mimeType.includes("sheet") ||
    file.mimeType.includes("presentation") ||
    file.name.toLowerCase().endsWith(".pdf") ||
    file.name.toLowerCase().endsWith(".docx") ||
    file.name.toLowerCase().endsWith(".doc") ||
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.name.toLowerCase().endsWith(".xls") ||
    file.name.toLowerCase().endsWith(".pptx") ||
    file.name.toLowerCase().endsWith(".ppt")
  );

  const isCanvaSupported = (
    file.mimeType.includes("presentation") ||
    file.name.toLowerCase().endsWith(".pptx") ||
    file.name.toLowerCase().endsWith(".ppt") ||
    file.mimeType.includes("image") ||
    file.mimeType.includes("pdf") ||
    file.name.toLowerCase().endsWith(".pdf")
  );

  const isMaxboardFile = file.name.toLowerCase().endsWith(".mxb");

  useEffect(() => {
    if (isOfficeDoc && viewer.current && fileUrl) {
      setIsViewerLoading(true);
      let active = true;
      let themeObserver: MutationObserver | null = null;

      WebViewer(
        {
          path: "/webviewer/lib",
          initialDoc: fileUrl,
          licenseKey: "YOUR_LICENSE_KEY_HERE",
          extension: file.name.split('.').pop()?.toLowerCase() || 'docx',
          disabledElements: [
            'header',
            'ribbons',
            'searchButton',
            'menuButton',
            'stickyAnnotationButton',
            'freeHandAnnotationButton',
            'freeTextAnnotationButton',
          ],
        },
        viewer.current
      ).then((instance) => {
        if (!active) return;
        const { documentViewer } = instance.Core;

        const syncViewerTheme = () => {
          const appTheme = document.documentElement.getAttribute("data-theme");
          instance.UI.setTheme(appTheme === "moon" ? "dark" : "light");
        };

        syncViewerTheme();
        themeObserver = new MutationObserver(syncViewerTheme);
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme"],
        });

        instance.UI.disableElements(['header']);

        documentViewer.addEventListener('documentLoaded', () => {
          if (active) {
            setIsViewerLoading(false);
          }
        });
      }).catch(err => {
        console.error("WebViewer loading failed:", err);
        if (active) {
          setIsViewerLoading(false);
        }
      });

      return () => {
        active = false;
        themeObserver?.disconnect();
      };
    }
  }, [fileUrl, isOfficeDoc, file.name]);

  const handleCloudImport = (target: "google" | "canva") => {
    setIsImporting(true);
    setImportTarget(target);
    setImportProgress(0);

    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (Math.random() * 20);
      });
    }, 150);

    setTimeout(() => {
      setIsImporting(false);
      setImportTarget(null);

      if (!fileUrl) {
        console.error("Cloud Import failed: File URL not ready.");
        return;
      }

      if (target === "google") {
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}`;
        window.open(googleDocsUrl, "_blank");
      } else if (target === "canva") {
        // Append a dummy extension if it's missing, as Canva uses the URL suffix to detect file type
        const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
        const suffixedUrl = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}ext=.${extension}`;

        const canvaUrl = `https://www.canva.com/design/create?type=IMPORT&import=${encodeURIComponent(suffixedUrl)}&title=${encodeURIComponent(file.name)}`;
        window.open(canvaUrl, "_blank");
      }
    }, 1500);
  };

  const handleAssignmentSubmit = async () => {
    if (!submissionFile) return;

    setSubmittingAssignment(true);
    setSubmissionError("");

    try {
      let storageId: Id<"_storage"> | undefined = undefined;
      if (submissionFile) {
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": submissionFile.type || "application/octet-stream" },
          body: submissionFile,
        });

        if (!uploadResult.ok) {
          throw new Error("File upload failed");
        }

        const uploaded = await uploadResult.json() as { storageId: Id<"_storage"> };
        storageId = uploaded.storageId;
      }

      await submitAssignment({
        assignmentId: file._id,
        classId: file.classId,
        storageId,
        fileName: submissionFile ? submissionFile.name : undefined,
        fileMimeType: submissionFile ? (submissionFile.type || "application/octet-stream") : undefined,
        fileSize: submissionFile ? submissionFile.size : undefined,
      });

      setSubmissionFile(null);
      setShowSubmission(true);
    } catch (error) {
      console.error("Assignment submission failed:", error);
      setSubmissionError("Submission failed. Please try again.");
      setShowSubmission(false);
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const getGradeDraft = (submission: any) => {
    if (gradeDrafts[submission._id]) return gradeDrafts[submission._id];
    return {
      score: submission.score !== undefined ? String(submission.score) : "",
      feedback: submission.feedback || "",
    };
  };

  const updateGradeDraft = (submissionId: string, patch: Partial<{ score: string; feedback: string }>) => {
    setGradeDrafts((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || { score: "", feedback: "" }),
        ...patch,
      },
    }));
  };

  const formatCommentTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const threadedComments = useMemo(() => {
    const byParent = new Map<string, any[]>();
    const roots: any[] = [];
    const sorted = [...fileComments].sort((a: any, b: any) => a.createdAt - b.createdAt);
    const idSet = new Set(sorted.map((comment: any) => String(comment._id)));

    for (const comment of sorted) {
      if (!comment.parentId || !idSet.has(String(comment.parentId))) {
        roots.push(comment);
        continue;
      }
      const key = String(comment.parentId);
      byParent.set(key, [...(byParent.get(key) || []), comment]);
    }

    return { roots, byParent };
  }, [fileComments]);

  const replyTarget = fileComments.find((comment: any) => comment._id === replyToCommentId);

  const submitFileCommentText = async () => {
    const content = commentDraft.trim();
    if (!content) return;
    await addFileComment({
      fileId: file._id,
      classId: file.classId,
      content,
      parentId: replyToCommentId || undefined,
    });
    setCommentDraft("");
    setReplyToCommentId(null);
  };

  const CommentCard = ({ comment, nested = false }: { comment: any; nested?: boolean }) => {
    const replies = threadedComments.byParent.get(String(comment._id)) || [];
    const author = comment.authorEmail?.split("@")[0] || "User";

    return (
      <div className={`rounded-xl border bg-white px-3 py-2.5 ${nested ? "border-emerald-100" : "border-slate-200"}`}>
        <div className="flex items-start gap-2.5">
          <div className={`h-8 w-8 rounded-full border shrink-0 inline-flex items-center justify-center text-[11px] font-bold ${nested ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
            {author.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700 truncate">{author}</p>
              <p className="text-[10px] text-slate-400 shrink-0">{formatCommentTime(comment.createdAt)}</p>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1 leading-5">{comment.content}</p>
            <button
              onClick={() => setReplyToCommentId(String(comment._id))}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              Reply
            </button>
          </div>
        </div>
        {replies.length > 0 && (
          <div className="mt-2.5 pl-3 border-l-2 border-emerald-100 space-y-2">
            {replies.map((reply: any) => (
              <CommentCard key={reply._id} comment={reply} nested />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200 text-left">
      <div className={`bg-white w-full rounded-none md:rounded-md shadow-2xl overflow-hidden flex flex-col h-screen md:h-[95vh] animate-in zoom-in-95 duration-200 border border-slate-200 relative ${isOfficeDoc ? 'max-w-7xl' : 'max-w-6xl'}`}>

        {/* Unified Top Navigation Bar */}
        <header className="px-6 py-3 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-[110] sticky top-0">
          {/* Left: File Info */}
          <div className="flex items-center gap-3 text-left min-w-0">
            <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center text-emerald-600 border border-slate-200 flex-shrink-0">
              {file.mimeType.includes("image") ? <ImageIcon className="w-4 h-4" /> : <FileIcon className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate">{file.name}</h2>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.08em] mt-0.5">
                {(file.size / 1024).toFixed(1)} KB • {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
              </p>
            </div>
          </div>

          {/* Center: Cloud Switcher (Desktop only) */}
          <div className="hidden md:flex items-center bg-slate-100/50 border border-slate-200 rounded-md p-1 shadow-sm">
            <button
              className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.08em] bg-white text-emerald-600 shadow-sm border border-slate-200 flex items-center gap-2"
            >
              <Layout className="w-2.5 h-2.5" /> High-Fidelity
            </button>

            {isOfficeDoc && (
              <button
                onClick={() => handleCloudImport("google")}
                className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 hover:bg-white/50 transition-all flex items-center gap-2"
              >
                <Globe className="w-2.5 h-2.5" /> Open in Google
              </button>
            )}

            {isCanvaSupported && (
              <button
                onClick={() => handleCloudImport("canva")}
                className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 hover:bg-white/50 transition-all flex items-center gap-2"
              >
                <Edit3 className="w-2.5 h-2.5" /> Edit in Canva
              </button>
            )}
          </div>

          {/* Right: Actions and Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => window.open(fileUrl || "")}
              className="px-3 py-1.5 rounded-md border border-slate-200 font-bold text-[10px] text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-[0.08em] hidden sm:flex items-center gap-2"
            >
              <Download className="w-3 h-3" /> Download
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
              title="Close Viewer"
              aria-label="Close file viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Cloud Bridge Overlay */}
        {isImporting && (
          <div className="absolute inset-0 bg-white/95 z-[120] flex items-center justify-center animate-in fade-in duration-300">
            <div className="max-w-xs w-full px-8 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg animate-bounce">
                {importTarget === "google" ? <Globe className="w-8 h-8" /> : <Edit3 className="w-8 h-8" />}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {importTarget === "google" ? "Syncing to Google" : "Importing to Canva"}
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em]">Establishing direct link...</p>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 ease-out"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-[0.1em] animate-pulse">Launching Cloud Editor</p>
            </div>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {isMaxboardFile ? (
            <div className="flex-1 overflow-auto p-8 md:p-16 bg-gradient-to-br from-violet-50 via-white to-slate-50 flex items-center justify-center">
              <div className="text-center py-12 px-12 bg-white rounded-2xl border border-violet-100 shadow-lg max-w-md w-full space-y-6">
                <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600 mx-auto border border-violet-200 shadow-inner">
                  <Presentation className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Maxboard Whiteboard</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">This is a Maxboard (.mxb) project file. To view or edit, open it in the Maxboard desktop application.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => window.open(fileUrl || "")}
                    className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={() => window.open(`maxboard://${fileUrl}`, "_blank")}
                    className="flex-1 bg-violet-600 text-white px-6 py-3 rounded-xl font-bold text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-violet-700 transition-all shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" /> Open in App
                  </button>
                </div>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Requires Maxboard by Biro</p>
              </div>
            </div>
          ) : !isOfficeDoc ? (
            <div className="flex-1 overflow-auto p-6 bg-slate-100/30 flex items-center justify-center">
              {!fileUrl ? (
                <div className="text-center py-24 animate-pulse text-slate-400 font-bold">Connecting to storage...</div>
              ) : file.mimeType.includes("image") ? (
                <div className="relative group">
                  <img
                    src={fileUrl}
                    alt={file.name}
                    className="max-w-full h-auto rounded-md shadow-lg border border-white"
                  />
                  <button
                    onClick={() => handleCloudImport("canva")}
                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-[0.08em] flex items-center gap-2 border border-slate-200 shadow-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Open in Canva
                  </button>
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-md border border-dashed border-slate-200 px-12">
                  <p className="text-slate-400 font-bold italic mb-6">Preview not available for this format</p>
                  <button
                    onClick={() => window.open(fileUrl || "")}
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-md font-bold text-[10px] tracking-widest uppercase flex items-center gap-2 mx-auto"
                  >
                    <Download className="w-3.5 h-3.5" /> Download File
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 w-full h-full relative">
              {(!fileUrl || isViewerLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-[105]">
                  <div className="text-center space-y-4">
                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimizing Document...</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Unified Engine Loading</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="w-full h-full" ref={viewer}></div>
            </div>
          )}
        </div>

        {file.isAssignment && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">Homework</p>
                  <p className="text-sm font-bold text-slate-900">{file.name}</p>
                </div>
                {file.dueDate && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Due {new Date(file.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {file.instructions && (
                <p className="text-xs text-slate-600 whitespace-pre-wrap">{file.instructions}</p>
              )}

              {questionPrompts.length > 0 && (
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Question Set</p>
                  <ol className="space-y-1.5">
                    {questionPrompts.map((question, index) => (
                      <li key={`${question}-${index}`} className="text-xs text-slate-700">
                        <span className="font-bold mr-1 text-slate-500">{index + 1}.</span>
                        {question}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {userRole === "student" ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`assignment-submission-${file._id}`}
                        className="hidden"
                        onChange={(e) => {
                          setSubmissionFile(e.target.files?.[0] || null);
                          setShowSubmission(false);
                          setSubmissionError("");
                        }}
                      />
                      <label
                        htmlFor={`assignment-submission-${file._id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {submissionFile ? "Change File" : "Upload Response"}
                      </label>
                      {submissionFile && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {submissionFile.name} ({Math.max(1, Math.round(submissionFile.size / 1024))} KB)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        void handleAssignmentSubmit();
                      }}
                      disabled={submittingAssignment || !submissionFile}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      {submittingAssignment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      {submittingAssignment ? "Submitting..." : "Submit Response"}
                    </button>
                  </div>
                  {showSubmission && (
                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Submission received.</p>
                  )}
                  {submissionError && (
                    <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500">{submissionError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Submissions</p>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{submissions.length} total</span>
                  </div>
                  {submissions.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium">No submissions yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-auto">
                      {submissions.map((s: any) => (
                        <div key={s._id} className="border border-slate-200 rounded-md bg-white px-3 py-2 space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span className="font-semibold">{s.studentId}</span>
                            <span className="font-bold">{new Date(s.submittedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {s.content && (
                              <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-[8px] font-bold uppercase tracking-widest text-slate-500">
                                Text
                              </span>
                            )}
                            {s.linkUrl && (
                              <span className="px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[8px] font-bold uppercase tracking-widest text-emerald-700">
                                Link
                              </span>
                            )}
                            {s.fileUrl && (
                              <span className="px-2 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-[8px] font-bold uppercase tracking-widest text-sky-700">
                                File
                              </span>
                            )}
                            {s.isLate && (
                              <span className="px-2 py-0.5 rounded-full border border-rose-200 bg-rose-50 text-[8px] font-bold uppercase tracking-widest text-rose-700">
                                Late
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {s.linkUrl && (
                              <button
                                onClick={() => window.open(s.linkUrl, "_blank")}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                              >
                                <Link2 className="w-3 h-3" /> Open Link
                              </button>
                            )}
                            {s.fileUrl && (
                              <button
                                onClick={() => window.open(s.fileUrl, "_blank")}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                              >
                                <Download className="w-3 h-3" /> Open File
                              </button>
                            )}
                          </div>
                          {s.content && (
                            <p className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-md border border-slate-100 px-2.5 py-2">
                              {s.content}
                            </p>
                          )}
                          <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 space-y-2">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Grade + Feedback</p>
                            <div className="flex items-center gap-2">
                              <input
                                value={getGradeDraft(s).score}
                                onChange={(e) => updateGradeDraft(s._id, { score: e.target.value })}
                                placeholder="Score"
                                type="number"
                                className="w-24 px-2 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-700"
                              />
                              <button
                                onClick={() => {
                                  void (async () => {
                                    const draft = getGradeDraft(s);
                                    await gradeAssignmentSubmission({
                                      submissionId: s._id,
                                      score: draft.score.trim() === "" ? undefined : Number(draft.score),
                                      feedback: draft.feedback.trim() || undefined,
                                    });
                                  })();
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-emerald-200 text-[9px] font-bold uppercase tracking-widest text-emerald-700 hover:bg-emerald-50"
                              >
                                <Save className="w-3 h-3" /> Save
                              </button>
                            </div>
                            <textarea
                              value={getGradeDraft(s).feedback}
                              onChange={(e) => updateGradeDraft(s._id, { feedback: e.target.value })}
                              placeholder="Feedback"
                              className="w-full px-2 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 h-16 resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {((file as any).allowComments ?? true) && (
                <div className="rounded-md border border-slate-200 bg-white p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 inline-flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> Discussion
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{fileComments.length} comments</span>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-auto">
                    {fileComments.length === 0 && (
                      <p className="text-xs text-slate-400 font-medium">No comments yet.</p>
                    )}
                    {threadedComments.roots.map((comment: any) => (
                      <CommentCard key={comment._id} comment={comment} />
                    ))}
                  </div>
                  {replyTarget && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 flex items-center justify-between gap-2">
                      <p className="text-[11px] text-emerald-700 truncate">
                        Replying to <span className="font-semibold">{replyTarget.authorEmail?.split("@")[0]}</span>
                      </p>
                      <button
                        onClick={() => setReplyToCommentId(null)}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder={replyToCommentId ? "Write a reply" : userRole === "student" ? "Ask a question" : "Leave a note"}
                      className="flex-1 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    />
                    <button
                      onClick={() => {
                        void submitFileCommentText();
                      }}
                      disabled={!commentDraft.trim()}
                      className="px-3 py-2 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-emerald-700"
                    >
                      {replyToCommentId ? "Reply" : "Post"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compact Footer */}
        <footer className="px-6 py-3 border-t border-slate-50 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">System Integrated Viewer • Secure Cloud Bridge Enabled</span>
          </div>
          <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
            Powered by Apryse High-Fidelity Engine
          </div>
        </footer>
      </div>
    </div>
  );
}
