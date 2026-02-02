import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

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
        className={`flex items-center gap-3 bg-brand-primary text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95 cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
      >
        <span>{uploading ? "⌛" : "➕"}</span>
        {uploading ? "UPLOADING..." : isAssignment ? "ASSIGN RESOURCE" : "SHARE RESOURCE"}
      </label>
    </div>
  );
}
