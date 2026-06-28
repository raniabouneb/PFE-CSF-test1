'use client';

interface ViewCertificateButtonProps {
  onClick?: () => void;
}

export default function ViewCertificateButton({ onClick }: ViewCertificateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#1a2a3a] shadow-sm transition hover:bg-gray-50"
    >
      Visualiser
    </button>
  );
}
