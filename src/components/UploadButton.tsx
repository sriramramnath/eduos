import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function UploadButton() {
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.myFunctions.generateUploadUrl);
  const uploadFile = useMutation(api.myFunctions.uploadFile);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();
      
      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await result.json();
      
      // Save file metadata to database
      await uploadFile({
        name: file.name,
        type: file.type,
        mimeType: file.type,
        size: file.size,
        storageId,
      });
      
      // Reset input
      event.target.value = "";
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className={`bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 ${
          uploading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {uploading ? "Uploading..." : "Upload File"}
      </label>
    </div>
  );
}
