export const RECOVERY_CONFIRM_PATH = "/auth/confirm";

export const SET_PASSWORD_PATHS = [
  "/definir-senha",
  "/redefinir-senha",
] as const;

export type SetPasswordRedirectPath = (typeof SET_PASSWORD_PATHS)[number];

export function sanitizeSetPasswordPath(
  next: string | null | undefined,
): SetPasswordRedirectPath {
  if (next === "/redefinir-senha") {
    return "/redefinir-senha";
  }

  return "/definir-senha";
}

export function buildRecoveryConfirmUrl(input: {
  baseUrl: string;
  hashedToken: string;
  nextPath: SetPasswordRedirectPath;
}): string {
  const url = new URL(RECOVERY_CONFIRM_PATH, input.baseUrl);
  url.searchParams.set("token_hash", input.hashedToken);
  url.searchParams.set("type", "recovery");
  url.searchParams.set("next", input.nextPath);
  return url.toString();
}
