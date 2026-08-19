import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-neo hover:bg-neo-burgundy-600 disabled:bg-[#cbb8ae] disabled:text-neo-white",
        secondary:
          "border border-[#dcc9c0] bg-neo-white text-neo-burgundy-800 shadow-neo hover:bg-neo-cream-soft disabled:bg-[#f1e7e1] disabled:text-[#a5928a]",
        outline:
          "border border-[#dcc9c0] bg-neo-white text-neo-burgundy-800 shadow-neo hover:bg-neo-cream-soft",
        ghost:
          "text-neo-burgundy-800 hover:bg-neo-cream-soft disabled:opacity-50",
        link: "text-primary underline-offset-4 hover:underline",
        gold: "bg-neo-gold-500 text-neo-burgundy-950 shadow-neo hover:bg-neo-gold-400",
        hero: "border border-white/30 bg-white/10 text-neo-white hover:bg-white/20",
        dangerGhost: "text-priority-red hover:bg-priority-red-soft/40",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 min-h-9 min-w-9 rounded-lg px-3 text-[13px]",
        lg: "h-12 rounded-[10px] px-8",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
