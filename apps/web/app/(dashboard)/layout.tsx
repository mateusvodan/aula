import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main className="pl-[var(--spacing-sidebar)]">
        <div className="mx-auto max-w-[1280px] px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
