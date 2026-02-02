import { useState } from "react";
import { Doc } from "../../convex/_generated/dataModel";
import { FileViewer } from "./FileViewer";
import { AssignmentModal } from "./AssignmentModal";

interface FileGridProps {
  files: Doc<"files">[];
  userRole: string;
}

export function FileGrid({ files, userRole }: FileGridProps) {
  const [selectedFile, setSelectedFile] = useState<Doc<"files"> | null>(null);
  const [assignmentFile, setAssignmentFile] = useState<Doc<"files"> | null>(null);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("word")) return "📄";
    if (mimeType.includes("presentation")) return "📊";
    if (mimeType.includes("sheet")) return "📈";
    if (mimeType.includes("pdf")) return "📕";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("video")) return "🎥";
    return "📁";
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-24 rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-100">
        <div className="text-5xl mb-4">📂</div>
        <p className="text-slate-400 font-bold italic">No files shared yet in this workspace.</p>
        {userRole !== "student" && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mt-4">Upload resources to get started</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {files.map((file) => (
          <div
            key={file._id}
            className="premium-card p-6 flex flex-col group"
          >
            <div className="flex items-start gap-5 mb-8">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100 group-hover:bg-pastel-blue group-hover:text-white transition-all">
                {getFileIcon(file.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-slate-900 truncate tracking-tight">{file.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                {file.editable && (
                  <span className="inline-block mt-3 px-3 py-1 bg-pastel-green/10 text-pastel-green text-[10px] font-black uppercase tracking-widest rounded-full border border-pastel-green/20">
                    Editable
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedFile(file)}
                className="flex-[2] bg-brand-primary text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all"
              >
                View
              </button>
              {userRole !== "student" && (
                <button
                  onClick={() => setAssignmentFile(file)}
                  className="flex-1 bg-pastel-green text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-pastel-green/20 hover:scale-105 transition-all flex items-center justify-center"
                >
                  📌
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedFile && (
        <FileViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          userRole={userRole}
        />
      )}

      {assignmentFile && (
        <AssignmentModal
          file={assignmentFile}
          onClose={() => setAssignmentFile(null)}
        />
      )}
    </>
  );
}
