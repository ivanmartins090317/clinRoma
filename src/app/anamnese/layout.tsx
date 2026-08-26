import { ClinicLogo } from "@/components/clinic-logo";

interface AnamneseLayoutProps {
  children: React.ReactNode;
}

export default function AnamneseLayout({ children }: AnamneseLayoutProps) {
  return (
    <div className="min-h-screen bg-neo-cream-50 px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
        <div className="flex justify-center">
          <ClinicLogo className="h-10 w-auto" />
        </div>
        {children}
      </div>
    </div>
  );
}
