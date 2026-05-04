"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PenLine, Settings, LineChart } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const quizMatch = pathname.match(/\/(?:builder|analytics)\/([^/]+)/);
  const quizId = quizMatch?.[1];

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[var(--spacing-sidebar)] flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-5 py-6">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight text-[var(--color-primary)]"
        >
          QuizConvert
        </Link>
        <p className="mt-1 text-xs text-slate-500">Funis interativos</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors",
                isActive &&
                  "border-l-2 border-[var(--color-primary-bright)] bg-white text-slate-900 shadow-sm",
                !isActive && "hover:bg-white/80",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
        {quizId ? (
          <>
            <Link
              href={`/builder/${quizId}`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                pathname.includes(`/builder/${quizId}`)
                  ? "border-l-2 border-[var(--color-primary-bright)] bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/80",
              )}
            >
              <PenLine className="h-4 w-4 shrink-0" />
              Builder
            </Link>
            <Link
              href={`/analytics/${quizId}`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                pathname.includes(`/analytics/${quizId}`)
                  ? "border-l-2 border-[var(--color-primary-bright)] bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/80",
              )}
            >
              <LineChart className="h-4 w-4 shrink-0" />
              Analytics
            </Link>
          </>
        ) : null}
      </nav>
    </aside>
  );
}
