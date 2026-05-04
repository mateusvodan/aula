"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";

export default function AnalyticsClient({ quizId }: { quizId: string }) {
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    leadsTotal: number;
    quizStarts: number;
    quizCompleted: number;
    completionRatePercent: number;
  } | null>(null);
  const [funnel, setFunnel] = useState<{ stepId: string; views: number }[]>([]);
  const [answers, setAnswers] = useState<
    { stepId: string; value: string; hits: number }[]
  >([]);
  const [leads, setLeads] = useState<
    { id: string; createdAt: string; data: Record<string, unknown> }[]
  >([]);
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
    Promise.all([
      apiFetch<typeof summary>(`/analytics/quiz/${quizId}/summary`, token),
      apiFetch<{ stepId: string; views: number }[]>(
        `/analytics/quiz/${quizId}/funnel`,
        token,
      ),
      apiFetch<typeof answers>(`/analytics/quiz/${quizId}/answers`, token),
      apiFetch<typeof leads>(`/analytics/quiz/${quizId}/leads`, token),
    ])
      .then(([s, f, a, l]) => {
        setSummary(s);
        setFunnel(f);
        setAnswers(a);
        setLeads(l);
      })
      .catch((e: Error) => setErr(e.message));
  }, [token, quizId]);

  if (err) {
    return <p className="text-sm text-red-600">{err}</p>;
  }

  return (
    <div className="space-y-10">
      <div>
        <Link href="/dashboard" className="text-xs text-slate-500 hover:underline">
          ← Painel
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Analytics</h1>
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Leads" value={String(summary.leadsTotal)} />
          <MetricCard label="Inícios" value={String(summary.quizStarts)} />
          <MetricCard label="Conclusões" value={String(summary.quizCompleted)} />
          <MetricCard
            label="Taxa conclusão"
            value={`${summary.completionRatePercent}%`}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-600">Carregando métricas…</p>
      )}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Drop-off por etapa</h2>
          <p className="text-xs text-slate-500">Eventos step_view</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-6 py-3">Step ID</th>
              <th className="px-6 py-3">Views</th>
            </tr>
          </thead>
          <tbody>
            {funnel.map((row) => (
              <tr key={row.stepId} className="border-b border-slate-100">
                <td className="px-6 py-3 font-mono text-xs">{row.stepId}</td>
                <td className="px-6 py-3">{row.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Respostas escolhidas</h2>
          <p className="text-xs text-slate-500">answer_selected</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-6 py-3">Step</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3">Hits</th>
            </tr>
          </thead>
          <tbody>
            {answers.map((row, i) => (
              <tr key={`${row.stepId}-${row.value}-${i}`} className="border-b border-slate-100">
                <td className="px-6 py-3 font-mono text-xs">{row.stepId}</td>
                <td className="px-6 py-3">{row.value}</td>
                <td className="px-6 py-3">{row.hits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Leads recentes</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Quando</th>
              <th className="px-6 py-3">Dados</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="px-6 py-3 font-mono text-xs">{l.id.slice(0, 8)}…</td>
                <td className="px-6 py-3 text-xs text-slate-600">
                  {new Date(l.createdAt).toLocaleString()}
                </td>
                <td className="max-w-md truncate px-6 py-3 font-mono text-xs">
                  {JSON.stringify(l.data)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
