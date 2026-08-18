import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function LogoutForm() {
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
