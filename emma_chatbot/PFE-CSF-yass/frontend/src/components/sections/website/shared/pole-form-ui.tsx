"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function Req() {
  return <span className="text-red-500">*</span>
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {children}
      </h2>
      <div className="mt-3 h-px w-full bg-slate-200" />
    </div>
  )
}

export function SelectField({
  id,
  label,
  required,
  value,
  onChange,
  options,
  allowEmptyPlaceholder = false,
}: {
  id: string
  label: React.ReactNode
  required?: boolean
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  allowEmptyPlaceholder?: boolean
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-4 pr-11 text-slate-800 shadow-sm",
            "focus:border-[#335FA1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#335FA1]/20",
          )}
        >
          {options.map((o) => (
            <option
              key={`${id}-${o.value || "placeholder"}`}
              value={o.value}
              disabled={!allowEmptyPlaceholder && o.value === ""}
            >
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
          aria-hidden
        />
      </div>
    </div>
  )
}

export const FIELD_INPUT_CLASS =
  "h-12 rounded-xl border-slate-200 bg-slate-50/80 px-4 text-base focus-visible:border-[#335FA1] focus-visible:ring-[#335FA1]/20"
