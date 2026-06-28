import { ValidationCenterBoard } from "@/components/platform/admin/validation/validation-center-board"

export default function AdminValidationPage() {
  return (
    <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
      <h1 className="sr-only">Centre de Validation et Documents</h1>
      <ValidationCenterBoard />
    </main>
  )
}
