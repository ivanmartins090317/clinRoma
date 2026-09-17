import { SetPasswordForm } from "@/features/auth/components/set-password-form";
import { AUTH_COPY } from "@/features/auth/domain/auth-copy";

export const metadata = { title: AUTH_COPY.resetPasswordTitle };

export default function RedefinirSenhaPage() {
  return <SetPasswordForm variant="reset" />;
}
