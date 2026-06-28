import ModuleDetailShell from "./module-detail-shell"

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ enrollmentId: string; moduleId: string }>
}) {
  const { enrollmentId, moduleId } = await params
  return <ModuleDetailShell enrollmentId={enrollmentId} moduleId={moduleId} />
}
