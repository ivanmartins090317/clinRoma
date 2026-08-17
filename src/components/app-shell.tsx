import Image from "next/image";
import Link from "next/link";
import { ClinicLogo } from "@/components/clinic-logo";
import { CLINROMA_MODULES } from "@/types/clinroma";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-neo-cream-50">
      <aside className="hidden w-64 shrink-0 bg-neo-burgundy-900 md:block">
        <div className="border-b border-neo-burgundy-800 px-5 py-6">
          <Link href="/hoje" className="inline-block">
            <ClinicLogo variant="on-dark" priority className="h-11 w-auto" />
          </Link>
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-neo-gold-400">
            ClinRoma
          </p>
          <p className="mt-0.5 text-sm text-neo-cream-100/80">
            Sistema clínico · demo
          </p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {CLINROMA_MODULES.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neo-cream-100/90 transition hover:bg-neo-burgundy-800 hover:text-neo-cream-100"
            >
              {module.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-neo-gray-200 bg-neo-white px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/hoje" className="md:hidden">
              <ClinicLogo variant="on-light" className="h-9 w-auto" />
            </Link>
            <p className="hidden text-sm text-brand-muted sm:block">
              Piloto · 5 dentistas · fila 40 min · QR estoque
            </p>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
