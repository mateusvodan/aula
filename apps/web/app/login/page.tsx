"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) setMsg(error.message);
    else window.location.href = "/dashboard";
  }

  async function oauth(provider: "google" | "facebook") {
    setLoading(true);
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${origin}/auth/callback` },
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Acesse sua conta</h1>
      <p className="mt-2 text-sm text-slate-600">
        Use email e senha ou provedor social (configure no Supabase).
      </p>
      <form onSubmit={signEmail} className="mt-8 flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "…" : "Entrar"}
        </Button>
      </form>
      {msg ? <p className="mt-4 text-sm text-red-600">{msg}</p> : null}
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-500">ou</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" onClick={() => oauth("google")}>
          Continuar com Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => oauth("facebook")}
        >
          Continuar com Facebook
        </Button>
      </div>
      <p className="mt-8 text-center text-sm text-slate-600">
        <Link href="/" className="text-[var(--color-primary)] underline">
          Voltar
        </Link>
      </p>
    </div>
  );
}
