/** Aligné sur la réponse FastAPI `GET /auth/me` et `PATCH /auth/profile` (camelCase). */
export type LearnerFormation = {
  id?: string
  title: string
  period?: string | null
  status?: string | null
  notes?: string | null
}

export type LearnerProject = {
  id?: string
  title: string
  description?: string
  context?: string | null
}

export type LearnerCertification = {
  id?: string
  title: string
  date?: string | null
  issuer?: string | null
}

export type LearnerRecommendation = {
  id?: string
  title: string
  fileName: string
  fileUrl: string
}

export type LearnerCv = {
  skillsSummary?: string
  formations?: LearnerFormation[]
  projects?: LearnerProject[]
  certifications?: LearnerCertification[]
  recommendations?: LearnerRecommendation[]
}

export type ProfileUser = {
  id: string
  email: string
  name: string | null
  /** apprenant | visiteur | admin | assistant */
  role?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  learnerCv?: LearnerCv | null
}

export function defaultLearnerCv(): LearnerCv {
  return {
    skillsSummary: "",
    formations: [],
    projects: [],
    certifications: [],
    recommendations: [],
  }
}

export function normalizeLearnerCv(cv: LearnerCv | null | undefined): LearnerCv {
  if (!cv) return defaultLearnerCv()
  return {
    skillsSummary: cv.skillsSummary ?? "",
    formations: cv.formations ?? [],
    projects: cv.projects ?? [],
    certifications: cv.certifications ?? [],
    recommendations: cv.recommendations ?? [],
  }
}
