import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { X, Download, Sparkles, FileText, Image as ImageIcon, File } from "lucide-react";

interface FileViewerProps {
  file: Doc<"files">;
  onClose: () => void;
  userRole: string;
}

export function FileViewer({ file, onClose, userRole }: FileViewerProps) {
  const fileUrl = useQuery(api.myFunctions.getFileUrl, { storageId: file.storageId });

  const canEdit = file.editable && (userRole === "teacher" || userRole === "admin");
  const isPresentation = file.mimeType.includes("presentation") || file.name.endsWith(".pptx") || file.name.endsWith(".ppt");

  const handleCanvaEdit = () => {
    if (!fileUrl) return;
    // @ts-ignore
    if (window.Canva && window.Canva.DesignButton) {
      // @ts-ignore
      window.Canva.DesignButton.initialize({
        apiKey: "MOCKED_CANVA_API_KEY", // Replace with real key in production
        onDesignPublish: (exportUrl: string) => {
          console.log("Canva design published:", exportUrl);
          // Here we would typically save the exported design back to Convex
        },
      });
    }
  };

  const renderPreview = () => {
    if (!fileUrl) return <div className="text-center py-24 animate-pulse text-slate-400 font-bold">Generating Preview...</div>;

    if (file.mimeType.includes("image")) {
      return (
        <img
          src={fileUrl}
          alt={file.name}
          className="max-w-full h-auto rounded-xl shadow-lg mx-auto border border-white"
        />
      );
    }

    if (file.mimeType.includes("pdf")) {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-[70vh] border-0 rounded-xl shadow-sm bg-white"
          title={file.name}
        />
      );
    }

    // Google Docs Viewer for Word, PPT, Excel
    const isDoc = file.mimeType.includes("word") || isPresentation || file.mimeType.includes("sheet");
    if (isDoc) {
      return (
        <div className="relative group">
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
            className="w-full h-[70vh] border-0 rounded-xl shadow-sm bg-white"
            title={file.name}
          />
        </div>
      );
    }

    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
        <p className="text-slate-400 font-bold italic mb-6">Preview not available for this file type</p>
        <button
          onClick={() => window.open(fileUrl)}
          className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-brand-primary/10 hover:-translate-y-0.5 transition-all text-[10px] tracking-widest uppercase flex items-center gap-2 mx-auto"
        >
          <Download className="w-4 h-4" /> Download to View
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200">
        <header className="px-8 py-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
              {file.mimeType.includes("image") ? <ImageIcon className="w-6 h-6" /> : file.mimeType.includes("pdf") ? <FileText className="w-6 h-6" /> : <File className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{file.name}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Shared resource • {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8 bg-slate-50/20">
          {renderPreview()}
        </div>

        <footer className="px-8 py-6 border-t border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Safe Preview Powered by EduOS</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.open(fileUrl || "")}
              className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-[10px] text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            {isPresentation && canEdit && (
              <button
                onClick={handleCanvaEdit}
                className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-bold text-[10px] shadow-md shadow-brand-primary/10 hover:-translate-y-0.5 transition-all uppercase tracking-widest flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" /> Edit with Canva
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
