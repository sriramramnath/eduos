import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Upload, Loader2 } from "lucide-react";

interface UploadButtonProps {
  classId: Id<"classes">;
  isAssignment?: boolean;
}

export function UploadButton({ classId, isAssignment = false }: UploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.myFunctions.generateUploadUrl);
  const uploadFile = useMutation(api.myFunctions.uploadFile);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      await uploadFile({
        name: file.name,
        type: file.type,
        mimeType: file.type,
        size: file.size,
        storageId,
        classId,
        isAssignment,
      });

      event.target.value = "";
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center">
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
        id={`file-upload-${classId}`}
      />
      <label
        htmlFor={`file-upload-${classId}`}
        className={`flex items-center gap-2.5 bg-emerald-600 text-white px-5 py-2.5 rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm transition-all hover:bg-emerald-700 cursor-pointer ${uploading ? "opacity-70 cursor-not-allowed" : ""
          }`}
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        {uploading ? "Wait..." : isAssignment ? "Assign Resource" : "Share Resource"}
      </label>
    </div>
  );
}
