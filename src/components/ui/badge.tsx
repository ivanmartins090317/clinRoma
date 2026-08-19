import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline:
          "border-neo-cream-line bg-neo-cream-soft text-muted-foreground",
        success:
          "border-transparent bg-priority-green-soft text-priority-green",
        warning:
          "border-transparent bg-priority-yellow-soft text-priority-yellow",
        destructive:
          "border-transparent bg-priority-red-soft text-priority-red",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps
  extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn(
            "size-2 rounded-full",
            variant === "destructive" && "bg-priority-red",
            variant === "warning" && "bg-[#d99f27]",
            variant === "success" && "bg-priority-green",
            variant === "outline" && "bg-muted-foreground",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
