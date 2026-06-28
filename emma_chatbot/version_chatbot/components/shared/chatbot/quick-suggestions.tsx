"use client";

interface QuickSuggestionsProps {
  onSelect: (text: string) => void;
}

const SUGGESTIONS = [
  { id: "formation", text: "📚 Formations disponibles" },
  { id: "reconversion", text: "🔄 Reconversion métier" },
  { id: "cv", text: "📄 Analyser mon CV" },
  { id: "contact", text: "📞 Contact" }
];

export function QuickSuggestions({ onSelect }: QuickSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2 my-4">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSelect(suggestion.text)}
          className="px-3 py-1.5 bg-[#e8f4fc] text-[#335FA1] hover:bg-[#335FA1] hover:text-white text-xs rounded-full transition-all duration-200 shadow-sm font-medium border border-[#d1e9f9]"
        >
          {suggestion.text}
        </button>
      ))}
    </div>
  );
}
