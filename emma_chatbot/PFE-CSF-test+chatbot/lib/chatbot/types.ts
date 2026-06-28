export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: Date
}

export type ChatIntent =
  | "GREETING"
  | "FORMATION_GENERAL"
  | "RECONVERSION"
  | "CURSUS_DETAIL"
  | "CONSEIL"
  | "SOLUTION"
  | "CERTIFICATION"
  | "CONTACT"
  | "CV_ANALYSIS"
  | "PARTENAIRES"
  | "PRIX"
  | "INSCRIPTION"
  | "UNKNOWN"

export interface IntentResult {
  intent: ChatIntent
  confidence: number
  entities: string[]
}

export interface KnowledgeEntry {
  id: string
  category: string
  title: string
  content: string
  keywords: string[]
  link?: string
}

export interface SkillMatch {
  skill: string
  domain: string
  confidence: number
}

export interface CourseRecommendation {
  id: string
  name: string
  title: string
  score: number
  matchPercentage: number
  reason: string
  link: string
}

export interface CVAnalysisResult {
  success: boolean
  fileName?: string
  extractedTextLength: number
  skills: SkillMatch[]
  recommendations: CourseRecommendation[]
  primaryRecommendation?: CourseRecommendation
  advice: string[]
  error?: string
}

export interface ChatbotResponse {
  message: string
  suggestions: string[]
  intent: ChatIntent
}
