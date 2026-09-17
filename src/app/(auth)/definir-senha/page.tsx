import { SetPasswordForm } from "@/features/auth/components/set-password-form";
import { AUTH_COPY } from "@/features/auth/domain/auth-copy";

export const metadata = { title: AUTH_COPY.setPasswordTitle };

export default function DefinirSenhaPage() {
  return <SetPasswordForm variant="invite" />;
}
