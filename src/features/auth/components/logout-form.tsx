import { LogOut } from "lucide-react";

import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutFormProps {
  variant?: "ghost" | "sidebar" | "topbar";
  compact?: boolean;
}

export function LogoutForm({ variant = "ghost", compact = false }: LogoutFormProps) {
  if (variant === "sidebar") {
    return (
      <form action={logoutAction} className="w-full">
        <Button
          type="submit"
          variant="ghost"
          title={compact ? "Sair da conta" : undefined}
          className={cn(
            "h-auto min-h-11 rounded-[10px] border border-white/20 py-2.5 text-sm font-normal text-neo-cream-100 hover:bg-white/10 hover:text-neo-white",
            compact
              ? "w-full justify-center px-0"
              : "w-full justify-start gap-2.5 px-3",
          )}
        >
          <LogOut className="size-4" aria-hidden />
          {compact ? (
            <span className="sr-only">Sair da conta</span>
          ) : (
            "Sair da conta"
          )}
        </Button>
      </form>
    );
  }

  if (variant === "topbar") {
    return (
      <form action={logoutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="min-h-9 text-muted-foreground hover:bg-neo-cream-soft hover:text-foreground"
        >
          Sair
        </Button>
      </form>
    );
  }

  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        className="min-h-11 text-neo-cream-100/90 hover:bg-neo-burgundy-800 hover:text-neo-cream-100"
      >
        Sair
      </Button>
    </form>
  );
}
