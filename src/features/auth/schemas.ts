import { z } from "zod";

import { AUTH_COPY } from "@/features/auth/domain/auth-copy";
import { isStrongTempPassword } from "@/features/team/domain/temp-password";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const setPasswordSchema = z
  .object({
    password: z.string().min(1, "Informe a senha"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .superRefine((value, ctx) => {
    if (!isStrongTempPassword(value.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: AUTH_COPY.weak,
      });
    }

    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: AUTH_COPY.mismatch,
      });
    }
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
