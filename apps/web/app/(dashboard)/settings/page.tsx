"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<{
    email: string | null;
    name: string | null;
    plan: string;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token ?? null;
      setToken(t);
      if (!t) window.location.href = "/login";
    });
  }, [supabase]);

  useEffect(() => {
    if (!token) return;
    apiFetch<typeof me>("/users/me", token).then(setMe);
  }, [token]);

  const apiUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
      : "";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
        <p className="mt-2 text-sm text-slate-600">
          Perfil e URLs da API para desenvolvimento.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold text-slate-900">Conta</h2>
        {me ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Nome</dt>
              <dd className="font-medium">{me.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium">{me.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Plano</dt>
              <dd className="font-medium">{me.plan}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Carregando…</p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-slate-900">Ambiente</h2>
        <p className="mt-2 text-sm text-slate-600">
          API base atual (NEXT_PUBLIC_API_URL):{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{apiUrl}</code>
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Cole no Supabase as variáveis do arquivo{" "}
          <code className="text-xs">apps/web/.env.local</code> e rode as migrações em{" "}
          <code className="text-xs">supabase/migrations</code>.
        </p>
      </Card>
    </div>
  );
}
