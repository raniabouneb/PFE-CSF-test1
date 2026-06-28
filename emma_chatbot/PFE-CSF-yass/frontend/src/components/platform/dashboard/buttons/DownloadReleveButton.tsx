'use client';

interface DownloadReleveButtonProps {
  onClick?: () => void;
}

export default function DownloadReleveButton({ onClick }: DownloadReleveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-[#1a2a3a] shadow-sm transition hover:bg-gray-50"
    >
      Télécharger le relevé
    </button>
  );
}
