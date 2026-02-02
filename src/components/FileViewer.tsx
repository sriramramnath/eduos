import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

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
          className="max-w-full h-auto rounded-[2rem] shadow-2xl mx-auto border-4 border-white"
        />
      );
    }

    if (file.mimeType.includes("pdf")) {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-[70vh] border-0 rounded-[2rem] shadow-inner bg-white"
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
            className="w-full h-[70vh] border-0 rounded-[2rem] shadow-inner bg-white"
            title={file.name}
          />
        </div>
      );
    }

    return (
      <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
        <p className="text-slate-400 font-bold italic mb-6">Preview not available for this file type</p>
        <button
          onClick={() => window.open(fileUrl)}
          className="bg-brand-primary text-white px-10 py-4 rounded-3xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all text-xs tracking-widest uppercase"
        >
          Download to View
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/20">
        <header className="px-10 py-8 flex items-center justify-between border-b border-slate-100 bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-5 text-left">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100">
              {file.mimeType.includes("image") ? "🖼️" : file.mimeType.includes("pdf") ? "📕" : "📄"}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{file.name}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Shared resource • {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-auto p-10 bg-slate-50/30">
          {renderPreview()}
        </div>

        <footer className="px-10 py-8 border-t border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-pastel-green animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safe Preview Powered by EduOS</span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => window.open(fileUrl || "")}
              className="px-8 py-3 rounded-2xl border-2 border-slate-200 font-black text-xs text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
            >
              Download
            </button>
            {isPresentation && canEdit && (
              <button
                onClick={handleCanvaEdit}
                className="bg-brand-primary text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all uppercase tracking-widest flex items-center gap-2"
              >
                <span className="text-lg">✨</span>
                Edit with Canva
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
