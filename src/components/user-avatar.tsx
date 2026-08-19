import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format/greeting";

interface UserAvatarProps {
  displayName: string;
  variant?: "sidebar" | "topbar";
  className?: string;
}

export function UserAvatar({
  displayName,
  variant = "sidebar",
  className,
}: UserAvatarProps) {
  const initials = getInitials(displayName);

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
        variant === "sidebar" &&
          "size-[30px] bg-neo-gold-500 text-[12px] text-neo-burgundy-950",
        variant === "topbar" &&
          "size-7 bg-neo-burgundy-800 text-[11px] text-neo-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}
