import { useState } from "react";
import { Doc } from "../../convex/_generated/dataModel";
import { FileViewer } from "./FileViewer";
import { AssignmentModal } from "./AssignmentModal";
import { FileText, FileSpreadsheet, Presentation, FileImage, Film, Folder, Pin, File } from "lucide-react";

interface FileGridProps {
  files: Doc<"files">[];
  userRole: string;
}

export function FileGrid({ files, userRole }: FileGridProps) {
  const [selectedFile, setSelectedFile] = useState<Doc<"files"> | null>(null);
  const [assignmentFile, setAssignmentFile] = useState<Doc<"files"> | null>(null);

  const getFileIcon = (mimeType: string, fileName: string) => {
    const iconClass = "w-6 h-6";
    if (fileName.toLowerCase().endsWith(".mxb")) return <Presentation className={`${iconClass} text-violet-500`} />;
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
      <div className="text-center py-16 rounded-md bg-slate-50 border border-dashed border-slate-200">
        <div className="flex justify-center mb-4 text-emerald-200">
          <Folder className="w-10 h-10" />
        </div>
        <p className="text-slate-400 font-bold italic text-sm">No files shared yet in this workspace.</p>
        {userRole !== "student" && (
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-2">Upload resources to get started</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {files.map((file) => (
          <div
            key={file._id}
            onClick={() => setSelectedFile(file)}
            className="premium-card p-4 flex flex-col group cursor-pointer hover:border-emerald-500/40 relative"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                {getFileIcon(file.mimeType, file.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate tracking-tight group-hover:text-emerald-600 transition-colors">{file.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex gap-1.5">
                {file.editable && (
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded border border-emerald-100">
                    Edit
                  </span>
                )}
                {file.isAssignment && (
                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded border border-rose-100">
                    Assign
                  </span>
                )}
              </div>

              {userRole !== "student" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignmentFile(file);
                  }}
                  className="w-8 h-8 rounded-md hover:bg-emerald-50 flex items-center justify-center text-slate-300 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100"
                  title="Add to Path"
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
