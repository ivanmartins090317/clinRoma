import { AppShell } from "@/components/app-shell";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
