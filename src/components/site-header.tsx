"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@supabase/supabase-js";

export function SiteHeader({
  variant = "marketing",
  user,
}: {
  variant?: "marketing" | "app";
  user?: User | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          Fun<span className="text-primary">quiz</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          {variant === "marketing" ? (
            <>
              <Link
                href="/login"
                className={pathname === "/login" ? "text-foreground" : "hover:text-foreground"}
              >
                Entrar
              </Link>
              <Link href="/signup">
                <Button size="sm" className="rounded-full shadow-sm shadow-primary/25">
                  Começar grátis
                </Button>
              </Link>
            </>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
              >
                Conta
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onSelect={(ev) => {
                    ev.preventDefault();
                    router.push("/dashboard");
                  }}
                >
                  Painel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(ev) => {
                    ev.preventDefault();
                    void logout();
                  }}
                >
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-full">
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
