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
      <div className="text-center py-12 text-gray-500">
        <p>No files uploaded yet</p>
        {userRole !== "student" && (
          <p className="text-sm mt-2">Upload your first file to get started</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <div
            key={file._id}
            className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex gap-2 mt-2">
                  {file.editable && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Editable
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setSelectedFile(file)}
                className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                View
              </button>
              {userRole !== "student" && (
                <button
                  onClick={() => setAssignmentFile(file)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Assign
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
