import type { LearnerAttendancePresence } from "@/lib/server/learner-api"

export type DashboardModuleBarSource = {
  title: string
  percent: number
  targetRef?: string
  groupId?: string
  memberId?: string
  presence?: LearnerAttendancePresence
}

export type FormationCourseSource = {
  groupId: string
  title: string
  attendanceRate?: number
  presentHours?: number
  absentHours?: number
  modules?: { id: string; title: string }[]
  rawModules?: { targetRef: string; title?: string }[]
}

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export function presenceFromCourse(course: FormationCourseSource): LearnerAttendancePresence {
  const presentHours = course.presentHours ?? 0
  const absentHours = course.absentHours ?? 0
  const resolved = presentHours + absentHours
  const attendancePercent =
    course.attendanceRate ??
    (resolved > 0 ? Math.round((presentHours / resolved) * 100) : 0)

  return { presentHours, absentHours, attendancePercent }
}

function findCourseForBar(
  bar: DashboardModuleBarSource,
  courses: FormationCourseSource[],
): FormationCourseSource | undefined {
  if (!courses.length) return undefined

  const barTitle = normalizeLabel(bar.title)
  const byGroup = bar.groupId
    ? courses.filter((c) => c.groupId === bar.groupId)
    : courses

  if (bar.targetRef) {
    const byRef = byGroup.find(
      (c) =>
        c.modules?.some((m) => m.id === bar.targetRef) ||
        c.rawModules?.some((m) => m.targetRef === bar.targetRef),
    )
    if (byRef) return byRef
  }

  if (byGroup.length === 1) return byGroup[0]

  const byTitle = byGroup.find((c) => {
    const courseTitle = normalizeLabel(c.title)
    if (barTitle && courseTitle && (courseTitle.includes(barTitle) || barTitle.includes(courseTitle))) {
      return true
    }
    return (c.modules ?? []).some((m) => normalizeLabel(m.title) === barTitle)
  })
  if (byTitle) return byTitle

  return byGroup[0]
}

function hasPresenceHours(presence: LearnerAttendancePresence | undefined): boolean {
  if (!presence) return false
  return (presence.presentHours ?? 0) + (presence.absentHours ?? 0) > 0
}

/** Présence affichée pour une barre (heures présentes / absentes, sans « en attente »). */
export function resolveBarPresence(
  bar: DashboardModuleBarSource,
  courses: FormationCourseSource[] | undefined,
): LearnerAttendancePresence {
  const api = bar.presence
  if (hasPresenceHours(api)) {
    return api!
  }

  const course = findCourseForBar(bar, courses ?? [])
  if (course) {
    return presenceFromCourse(course)
  }

  if (api) {
    return api
  }

  return {
    presentHours: 0,
    absentHours: 0,
    attendancePercent: 0,
  }
}
