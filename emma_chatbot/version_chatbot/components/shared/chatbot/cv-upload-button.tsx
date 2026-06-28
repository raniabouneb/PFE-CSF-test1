"use client";

import { Paperclip, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

interface CVUploadButtonProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function CVUploadButton({ onUpload, isUploading }: CVUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      await onUpload(file);
    }
    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="p-2 text-gray-500 hover:text-[#335FA1] transition-colors rounded-full hover:bg-gray-100 focus:outline-none disabled:opacity-50"
        title="Analyser mon CV (PDF)"
      >
        {isUploading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Paperclip size={20} />
        )}
      </button>
    </div>
  );
}
