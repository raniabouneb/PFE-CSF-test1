'use client'

import { Clock, AlertCircle } from 'lucide-react'

interface CertificationCardProps {
  icon?: React.ReactNode
  category: string
  title: string
  subtitle: string
  description: string
  skills: string[]
  duration: string
  level: 'Débutant' | 'Intermédiaire' | 'Avancé'
  onDetailsClick?: () => void
  onEnrollClick?: () => void
}

export function CertificationCard({
  icon,
  category,
  title,
  subtitle,
  description,
  skills,
  duration,
  level,
  onDetailsClick,
  onEnrollClick,
}: CertificationCardProps) {
  const levelColors = {
    'Débutant': 'bg-green-100 text-green-700',
    'Intermédiaire': 'bg-yellow-100 text-yellow-700',
    'Avancé': 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-8 rounded-4xl bg-white border border-[#2B5E94] flex flex-col">
      {/* Icon */}
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 text-[#2B5E94]">
          {icon}
        </div>
      )}

      {/* Category */}
      <p className="text-xs font-semibold text-[#1F6CA3] uppercase tracking-widest mb-2">
        {category}
      </p>

      {/* Title */}
      <h3 className="text-xl font-bold text-[#1F6CA3] mb-1">
        {title}
      </h3>

      {/* Subtitle */}
      <p className="text-lg font-semibold text-[#154866] mb-4">
        {subtitle}
      </p>

      {/* Description */}
      <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
        {description}
      </p>

      {/* Skills Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {skills.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Duration and Level */}
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">{duration}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[level]}`}>
          {level}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onDetailsClick}
          className="flex-1 px-4 py-3 rounded-3xl border-2 border-[#1F6CA3] text-[#1F6CA3] font-semibold hover:bg-blue-50 transition-colors"
        >
          Voir les détails
        </button>
        <button
          onClick={onEnrollClick}
          className="flex-1 px-4 py-3 rounded-3xl bg-[#1F6CA3] text-white font-semibold hover:bg-blue-800 transition-colors"
        >
          S&apos;inscrire
        </button>
      </div>
    </div>
  )
}
