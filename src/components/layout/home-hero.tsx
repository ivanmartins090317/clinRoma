import Link from "next/link";
import { QrCode } from "lucide-react";

import { ClinicLogo } from "@/components/clinic-logo";
import { Button } from "@/components/ui/button";
import { formatHeroDate, getTimeGreeting } from "@/lib/format/greeting";

interface HomeHeroProps {
  displayName: string;
  showScanShortcut?: boolean;
}

export function HomeHero({ displayName, showScanShortcut }: HomeHeroProps) {
  const greeting = getTimeGreeting();
  const heroDate = formatHeroDate();

  return (
    <section className="relative mb-4.5 overflow-hidden rounded-[18px] bg-linear-to-br from-neo-burgundy-950 via-neo-burgundy-700 to-neo-burgundy-600 p-5 text-neo-white shadow-neo sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-22.5 -right-17.5 size-65 rounded-full bg-[radial-gradient(circle,rgba(217,164,65,0.22),transparent_65%)]"
      />
      <div className="relative z-1 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[1.375rem] font-extrabold tracking-tight sm:text-[1.625rem]">
            {greeting}, {displayName}
          </h2>
          <p className="mt-1.5 text-[13px] font-bold tracking-[0.06em] text-neo-gold-500 uppercase">
            {heroDate}
          </p>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-neo-cream-100/90">
            Consultas do dia, fila de espera e atalhos operacionais. Tudo num
            só lugar.
          </p>
        </div>
        <ClinicLogo
          variant="on-dark"
          className="hidden h-14 w-auto shrink-0 opacity-90 sm:block md:h-16"
          priority
        />
      </div>
      <div className="relative z-1 mt-4 flex flex-wrap gap-2.5 sm:mt-4.5">
        <Button asChild variant="gold" size="sm" className="min-h-11 flex-1 sm:flex-none">
          <Link href="/agenda">Nova consulta</Link>
        </Button>
        {showScanShortcut ? (
          <Button
            asChild
            variant="hero"
            size="sm"
            className="min-h-11 flex-1 sm:flex-none"
          >
            <Link href="/estoque/scan">
              <QrCode aria-hidden />
              Scan QR
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
