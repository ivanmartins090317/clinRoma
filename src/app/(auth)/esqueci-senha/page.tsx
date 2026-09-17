import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { AUTH_COPY } from "@/features/auth/domain/auth-copy";

export const metadata = { title: AUTH_COPY.forgotTitle };

export default function EsqueciSenhaPage() {
  return <ForgotPasswordForm />;
}