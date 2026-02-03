import { useState } from "react";
import { Doc } from "../../convex/_generated/dataModel";
import { FileViewer } from "./FileViewer";
import { AssignmentModal } from "./AssignmentModal";
import { FileText, FileSpreadsheet, Presentation, FileImage, Film, Folder, Eye, Pin, File } from "lucide-react";

interface FileGridProps {
  files: Doc<"files">[];
  userRole: string;
}

export function FileGrid({ files, userRole }: FileGridProps) {
  const [selectedFile, setSelectedFile] = useState<Doc<"files"> | null>(null);
  const [assignmentFile, setAssignmentFile] = useState<Doc<"files"> | null>(null);

  const getFileIcon = (mimeType: string) => {
    const iconClass = "w-6 h-6";
    if (mimeType.includes("word")) return <FileText className={iconClass} />;
    if (mimeType.includes("presentation")) return <Presentation className={iconClass} />;
    if (mimeType.includes("sheet")) return <FileSpreadsheet className={iconClass} />;
    if (mimeType.includes("pdf")) return <FileText className={`${iconClass} text-red-500`} />;
    if (mimeType.includes("image")) return <FileImage className={iconClass} />;
    if (mimeType.includes("video")) return <Film className={iconClass} />;
    return <File className={iconClass} />;
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
        <div className="flex justify-center mb-4 text-slate-300">
          <Folder className="w-12 h-12" />
        </div>
        <p className="text-slate-400 font-bold italic">No files shared yet in this workspace.</p>
        {userRole !== "student" && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mt-3">Upload resources to get started</p>
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
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-brand-primary group-hover:text-white transition-all">
                {getFileIcon(file.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-slate-900 truncate tracking-tight">{file.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                {file.editable && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-green-100">
                    Editable
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFile(file)}
                className="flex-[2] bg-brand-primary text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md shadow-brand-primary/10 hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              {userRole !== "student" && (
                <button
                  onClick={() => setAssignmentFile(file)}
                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md shadow-slate-900/10 hover:translate-y-[-1px] transition-all flex items-center justify-center"
                >
                  <Pin className="w-3.5 h-3.5" />
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
