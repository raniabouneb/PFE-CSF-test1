'use client';

interface PrintCertificateButtonProps {
  onClick?: () => void;
  className?: string;
}

export default function PrintCertificateButton({ onClick, className = '' }: PrintCertificateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg bg-[#1e4a72] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D3570] ${className}`}
    >
      Imprimer
    </button>
  );
}
