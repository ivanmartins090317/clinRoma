import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  titleClassName?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  titleClassName,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-5 flex flex-col items-stretch justify-between gap-3 sm:mb-6 md:flex-row md:items-start md:gap-5",
        className,
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "text-2xl font-extrabold tracking-tight text-foreground md:text-[1.875rem]",
            titleClassName,
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2.5 md:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
