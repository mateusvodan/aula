"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-[box-shadow,border-color]",
        "focus:border-[var(--color-primary-bright)] focus:ring-2 focus:ring-[var(--color-primary-bright)]/25",
        className,
      )}
      {...props}
    />
  );
}
