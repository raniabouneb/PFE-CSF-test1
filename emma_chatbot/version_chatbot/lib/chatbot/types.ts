export type ChatRole = "user" | "bot";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  isMarkdown?: boolean;
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
  | "UNKNOWN";

export interface KnowledgeEntry {
  title: string;
  content: string;
  keywords: string[];
  link?: string;
}

export interface SkillMatch {
  skill: string;
  category: string;
}

export interface CourseRecommendation {
  courseName: string;
  score: number; // 0 to 100
  matchedSkills: string[];
  missingSkills: string[];
  description: string;
  link: string;
}

export interface CVAnalysisResult {
  detectedSkills: SkillMatch[];
  recommendation: CourseRecommendation;
  advice: string;
  success: boolean;
  error?: string;
}
