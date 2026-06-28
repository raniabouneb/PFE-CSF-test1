"use client"

interface QuickSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  visible?: boolean
}

export function QuickSuggestions({ suggestions, onSelect, visible = true }: QuickSuggestionsProps) {
  if (!visible || suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-[#e8f4fc] text-[#335FA1] border border-[#335FA1]/20 hover:bg-[#d0e8f8] hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
