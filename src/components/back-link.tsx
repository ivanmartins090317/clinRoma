import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BackLinkProps {
  href: string;
  label: string;
}

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Button variant="outline" asChild className="w-fit px-3 bg-transparent">
      <Link href={href}>
        <ChevronLeftIcon strokeWidth={2} aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
}
