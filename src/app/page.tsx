import { redirect } from "next/navigation";

import { getDefaultAppPath } from "@/lib/auth/roles";
import { getAuthSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  redirect(getDefaultAppPath(session.profile.role));
}
