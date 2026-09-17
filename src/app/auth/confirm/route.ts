import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { sanitizeSetPasswordPath } from "@/features/auth/domain/recovery-link";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const nextPath = sanitizeSetPasswordPath(
    request.nextUrl.searchParams.get("next"),
  );
  const invalidPath = `${nextPath}?erro=link`;

  if (!hasSupabaseConfig()) {
    redirect(invalidPath);
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (tokenHash && type === "recovery") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });

    if (!error) {
      redirect(nextPath);
    }
  }

  redirect(invalidPath);
}
