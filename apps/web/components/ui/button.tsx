"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center rounded px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50";
  const variants = {
    primary: "bg-[var(--color-primary-bright)] text-white hover:bg-[var(--color-primary)] border border-t border-white/20",
    secondary:
      "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
    ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props} />
  );
}
