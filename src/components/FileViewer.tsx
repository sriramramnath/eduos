import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { X, Download, Image as ImageIcon, File, Globe, Layout, Edit3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WebViewer from "@pdftron/webviewer";

interface FileViewerProps {
  file: Doc<"files">;
  onClose: () => void;
}

type ViewerMode = "apryse" | "google" | "canva";

export function FileViewer({ file, onClose }: FileViewerProps) {
  const viewer = useRef<HTMLDivElement>(null);
  const fileUrl = useQuery(api.myFunctions.getFileUrl, { storageId: file.storageId });
  const [isViewerLoading, setIsViewerLoading] = useState(true);
  const [viewerMode, setViewerMode] = useState<ViewerMode>("apryse");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

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
    file.mimeType.includes("image")
  );

  useEffect(() => {
    if (isOfficeDoc && viewer.current && fileUrl && viewerMode === "apryse") {
      setIsViewerLoading(true);
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
        const { documentViewer } = instance.Core;
        instance.UI.setTheme('light');
        instance.UI.disableElements(['header']);

        documentViewer.addEventListener('documentLoaded', () => {
          setIsViewerLoading(false);
        });
      }).catch(err => {
        console.error("WebViewer loading failed:", err);
        setIsViewerLoading(false);
      });
    }
  }, [fileUrl, isOfficeDoc, viewerMode]);

  const handleCloudImport = (target: "google" | "canva") => {
    setIsImporting(true);
    setImportProgress(0);

    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (Math.random() * 15);
      });
    }, 200);

    setTimeout(() => {
      setIsImporting(false);
      if (target === "google") {
        setViewerMode("google");
      } else if (target === "canva") {
        // Canva direct import URL
        const canvaUrl = `https://www.canva.com/design?create&type=IMPORT&url=${encodeURIComponent(fileUrl || "")}`;
        window.open(canvaUrl, "_blank");
      }
    }, 2000);
  };

  const googleViewerUrl = fileUrl ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true` : null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className={`bg-white w-full rounded-none md:rounded-md shadow-2xl overflow-hidden flex flex-col h-screen md:h-[95vh] animate-in zoom-in-95 duration-200 border border-slate-200 relative ${isOfficeDoc ? 'max-w-7xl' : 'max-w-6xl'}`}>

        {/* Unified Top Navigation Bar */}
        <header className="px-6 py-3 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-[110] sticky top-0">
          {/* Left: File Info */}
          <div className="flex items-center gap-3 text-left min-w-0">
            <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center text-emerald-600 border border-slate-200 flex-shrink-0">
              {file.mimeType.includes("image") ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate">{file.name}</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {(file.size / 1024).toFixed(1)} KB • {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
              </p>
            </div>
          </div>

          {/* Center: Switcher (Desktop only, for supported docs) */}
          {isOfficeDoc && (
            <div className="hidden md:flex items-center bg-slate-100/50 border border-slate-200 rounded-md p-1 shadow-sm">
              <button
                onClick={() => setViewerMode("apryse")}
                className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewerMode === "apryse" ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-white/50"}`}
              >
                <Layout className="w-2.5 h-2.5" /> High-Fidelity
              </button>
              <button
                onClick={() => handleCloudImport("google")}
                className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewerMode === "google" ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-white/50"}`}
              >
                <Globe className="w-2.5 h-2.5" /> Google Cloud
              </button>
              {isCanvaSupported && (
                <button
                  onClick={() => handleCloudImport("canva")}
                  className="px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/50 transition-all flex items-center gap-2"
                >
                  <Edit3 className="w-2.5 h-2.5" /> Edit in Canva
                </button>
              )}
            </div>
          )}

          {/* Right: Actions and Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => window.open(fileUrl || "")}
              className="px-3 py-1.5 rounded-md border border-slate-200 font-bold text-[9px] text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest hidden sm:flex items-center gap-2"
            >
              <Download className="w-3 h-3" /> Download
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
              title="Close Viewer"
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
                <Globe className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Syncing to Cloud</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Uploading {file.name}...</p>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 ease-out"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">Establishing Secure Bridge</p>
            </div>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {!isOfficeDoc ? (
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
                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 border border-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-all"
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
              {viewerMode === "apryse" ? (
                <>
                  {(!fileUrl || isViewerLoading) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-[105]">
                      <div className="text-center space-y-4">
                        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimizing Document...</p>
                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">Unified Engine Loading</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="w-full h-full" ref={viewer}></div>
                </>
              ) : (
                <div className="w-full h-full bg-slate-100 flex flex-col">
                  {googleViewerUrl ? (
                    <iframe
                      src={googleViewerUrl}
                      className="w-full flex-1 border-none"
                      title="Google Cloud Viewer"
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 font-bold animate-pulse">
                      Connecting to Google Cloud...
                    </div>
                  )}
                  <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-center gap-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">External Viewer Mode • Interactive Tools Disabled</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <footer className="px-6 py-3 border-t border-slate-50 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">System Integrated Viewer • Secure Data Transmission</span>
          </div>
          <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
            {viewerMode === "apryse" ? "Powered by Apryse" : viewerMode === "google" ? "Powered by Google Cloud" : "Powered by Canva"}
          </div>
        </footer>
      </div>
    </div>
  );
}
