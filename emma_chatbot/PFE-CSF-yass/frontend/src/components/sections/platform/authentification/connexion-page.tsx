import { AuthPageShell } from "./sections/auth-page-shell"
import { LoginForm } from "./sections/login-form"

export function ConnexionPageView() {
  return (
    <AuthPageShell>
      <LoginForm variant="page" />
    </AuthPageShell>
  )
}
