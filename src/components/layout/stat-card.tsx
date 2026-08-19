import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  href: string;
  value: ReactNode;
  label: string;
  hint?: string;
  warn?: boolean;
  className?: string;
}

export function StatCard({
  href,
  value,
  label,
  hint,
  warn = false,
  className,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-0.5 rounded-[var(--radius)] border border-[#f0e3db] bg-neo-white p-[15px] text-left shadow-neo transition-[transform,border-color] hover:-translate-y-0.5 hover:border-neo-wine-accent md:p-[17px]",
        warn && "border-l-4 border-l-neo-gold-500",
        className,
      )}
    >
      <span
        className={cn(
          "text-[1.625rem] font-extrabold tracking-tight text-foreground",
          warn && "text-priority-yellow",
        )}
      >
        {value}
      </span>
      <span className="text-[13.5px] font-bold text-foreground">{label}</span>
      {hint ? (
        <span className="text-xs text-neo-ink-3">{hint}</span>
      ) : null}
    </Link>
  );
}
