"use client"

import { useRef } from "react"
import { Paperclip, Loader2 } from "lucide-react"

interface CVUploadButtonProps {
  onFileSelect: (file: File) => void
  isLoading: boolean
  fileName?: string
  disabled?: boolean
}

export function CVUploadButton({ onFileSelect, isLoading, fileName, disabled }: CVUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!isLoading && !disabled) {
      inputRef.current?.click()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
      e.target.value = ""
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleChange}
        className="hidden"
        aria-hidden
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || disabled}
        className="p-2 rounded-full text-[#335FA1] hover:bg-[#e8f4fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Uploader un CV PDF"
        title="Analyser mon CV (PDF)"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>
      {fileName && !isLoading && (
        <span className="text-xs text-gray-500 max-w-[80px] truncate" title={fileName}>
          {fileName}
        </span>
      )}
    </div>
  )
}
