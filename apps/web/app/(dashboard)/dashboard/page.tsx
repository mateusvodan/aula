"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type QuizRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt?: string;
};

export default function DashboardPage() {
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);
  const [list, setList] = useState<QuizRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token ?? null;
      setToken(t);
      if (!t) window.location.href = "/login";
    });
  }, [supabase]);

  useEffect(() => {
    if (!token) return;
    apiFetch<QuizRow[]>("/quizzes", token)
      .then(setList)
      .catch((e: Error) => setErr(e.message));
  }, [token]);

  async function createQuiz() {
    if (!token) return;
    const name = prompt("Nome do quiz?");
    if (!name?.trim()) return;
    const row = await apiFetch<QuizRow>("/quizzes", token, {
      method: "POST",
      body: JSON.stringify({ name: name.trim() }),
    });
    window.location.href = `/builder/${row.id}`;
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Painel
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gerencie quizzes, métricas e publicação.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={logout}>
            Sair
          </Button>
          <Button type="button" onClick={createQuiz}>
            Novo quiz
          </Button>
        </div>
      </div>
      {err ? (
        <p className="mt-6 text-sm text-red-600">{err}</p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((q) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{q.name}</h3>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    /quiz/{q.slug}
                  </p>
                </div>
                <span
                  className={
                    q.status === "published"
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                      : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                  }
                >
                  {q.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/builder/${q.id}`}>
                  <Button variant="secondary" type="button" className="text-xs">
                    Builder
                  </Button>
                </Link>
                <Link href={`/analytics/${q.id}`}>
                  <Button variant="ghost" type="button" className="text-xs">
                    Analytics
                  </Button>
                </Link>
                <Link href={`/quiz/${q.slug}`} target="_blank">
                  <Button variant="ghost" type="button" className="text-xs">
                    Abrir público
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
