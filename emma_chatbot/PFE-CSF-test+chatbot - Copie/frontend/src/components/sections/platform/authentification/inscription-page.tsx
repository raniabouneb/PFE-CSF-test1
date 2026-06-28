import { AuthPageShell } from "./sections/auth-page-shell"
import { SignupForm } from "./sections/signup-form"

export function InscriptionPageView() {
  return (
    <AuthPageShell>
      <SignupForm variant="page" />
    </AuthPageShell>
  )
}
