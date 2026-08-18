import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { getAuthSession } from "@/lib/auth/session";
import { sanitizeReturnTo } from "@/lib/auth/roles";
import { hasSupabaseConfig } from "@/lib/env";

export const metadata = { title: "Entrar" };

interface LoginPageProps {
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = sanitizeReturnTo(params.returnTo);

  if (hasSupabaseConfig()) {
    const session = await getAuthSession();

    if (session) {
      redirect(returnTo);
    }
  }

  return <LoginForm returnTo={returnTo} />;
}
