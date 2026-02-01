import { useState } from "react";
import { Doc } from "../../convex/_generated/dataModel";

interface FileViewerProps {
  file: Doc<"files">;
  onClose: () => void;
  userRole: string;
}

export function FileViewer({ file, onClose, userRole }: FileViewerProps) {
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = file.editable && (userRole === "teacher" || userRole === "admin");

  const renderPreview = () => {
    if (file.mimeType.includes("image")) {
      return (
        <img 
          src={`/api/files/${file.storageId}`} 
          alt={file.name}
          className="max-w-full h-auto"
        />
      );
    }
    
    if (file.mimeType.includes("pdf")) {
      return (
        <iframe
          src={`/api/files/${file.storageId}`}
          className="w-full h-96 border"
          title={file.name}
        />
      );
    }

    if (file.editable) {
      return (
        <div className="border rounded p-4 bg-gray-50">
          <p className="text-gray-600 mb-2">Editable document</p>
          {isEditing ? (
            <DocumentEditor file={file} onSave={() => setIsEditing(false)} />
          ) : (
            <div>
              <p>Document preview would appear here</p>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Edit Document
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-gray-500">
        <p>Preview not available for this file type</p>
        <p className="text-sm mt-2">Download to view the file</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">{file.name}</h2>
            <p className="text-sm text-gray-600">
              {(file.size / 1024).toFixed(1)} KB • {file.type}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.open(`/api/files/${file.storageId}/download`)}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
            >
              Download
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}

function DocumentEditor({ file, onSave }: { file: Doc<"files">; onSave: () => void }) {
  const [content, setContent] = useState("Document content would be loaded here...");

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-64 border rounded p-3 font-mono text-sm"
        placeholder="Document content..."
      />
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm"
        >
          Save Changes
        </button>
        <button
          onClick={onSave}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
