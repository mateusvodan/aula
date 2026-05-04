"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Step = {
  id: string;
  type: string;
  orderIndex: number;
  metadata: Record<string, unknown>;
};
type Option = {
  id: string;
  stepId: string;
  label: string;
  value: string;
  nextStepId: string | null;
  orderIndex: number;
};
type ResultRow = {
  id: string;
  name: string;
  conditions: Record<string, unknown>;
  redirectUrl: string | null;
  orderIndex: number;
};
type Quiz = {
  id: string;
  name: string;
  slug: string;
  status: string;
  facebookPixelId?: string | null;
  googleAnalyticsId?: string | null;
  googleTagManagerId?: string | null;
  tiktokPixelId?: string | null;
  webhookUrl?: string | null;
};

function SortStep({
  step,
  children,
}: {
  step: Step;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-slate-200 bg-white"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <button
          type="button"
          className="cursor-grab rounded px-2 py-1 text-slate-400 hover:bg-slate-50 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ::
        </button>
        <span className="text-xs font-semibold uppercase text-slate-500">
          {step.type}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function BuilderClient({ quizId }: { quizId: string }) {
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token ?? null;
      setToken(t);
      if (!t) window.location.href = "/login";
    });
  }, [supabase]);

  async function refresh() {
    if (!token) return;
    const q = await apiFetch<Quiz>(`/quizzes/${quizId}`, token);
    setQuiz(q);
    const g = await apiFetch<{
      steps: Step[];
      options: Option[];
      results: ResultRow[];
    }>(`/quizzes/${quizId}/graph`, token);
    setSteps([...g.steps].sort((a, b) => a.orderIndex - b.orderIndex));
    setOptions(g.options);
    setResults([...g.results].sort((a, b) => a.orderIndex - b.orderIndex));
  }

  useEffect(() => {
    if (!token) return;
    refresh().catch((e: Error) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh depende de token/quizId apenas no mount
  }, [token, quizId]);

  const optsByStep = useMemo(() => {
    const m: Record<string, Option[]> = {};
    for (const o of options) {
      (m[o.stepId] ??= []).push(o);
    }
    for (const k of Object.keys(m)) {
      m[k]!.sort((a, b) => a.orderIndex - b.orderIndex);
    }
    return m;
  }, [options]);

  async function onDragEnd(e: DragEndEvent) {
    if (!token || !e.over || e.active.id === e.over.id) return;
    const ids = steps.map((s) => s.id);
    const oldIndex = ids.indexOf(String(e.active.id));
    const newIndex = ids.indexOf(String(e.over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const ordered = arrayMove(ids, oldIndex, newIndex);
    setSteps(arrayMove(steps, oldIndex, newIndex));
    await apiFetch(`/quizzes/${quizId}/steps/reorder`, token, {
      method: "POST",
      body: JSON.stringify({ orderedStepIds: ordered }),
    });
  }

  async function addStep(type: Step["type"]) {
    if (!token) return;
    await apiFetch(`/quizzes/${quizId}/steps`, token, {
      method: "POST",
      body: JSON.stringify({ type }),
    });
    await refresh();
  }

  async function updateMetadata(stepId: string, meta: Record<string, unknown>) {
    if (!token) return;
    await apiFetch(`/quizzes/${quizId}/steps/${stepId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ metadata: meta }),
    });
    await refresh();
  }

  async function addOption(stepId: string) {
    if (!token) return;
    const label = prompt("Rótulo da opção?");
    const value = prompt("Valor interno?") ?? label;
    if (!label) return;
    await apiFetch(`/quizzes/${quizId}/steps/${stepId}/options`, token, {
      method: "POST",
      body: JSON.stringify({ label, value: value ?? label }),
    });
    await refresh();
  }

  async function savePixels(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || !quiz) return;
    const fd = new FormData(e.currentTarget);
    await apiFetch(`/quizzes/${quizId}`, token, {
      method: "PATCH",
      body: JSON.stringify({
        facebookPixelId: fd.get("fb") || null,
        googleAnalyticsId: fd.get("ga") || null,
        googleTagManagerId: fd.get("gtm") || null,
        tiktokPixelId: fd.get("tt") || null,
        webhookUrl: fd.get("wh") || null,
      }),
    });
    await refresh();
    alert("Salvo.");
  }

  async function publish() {
    if (!token) return;
    await apiFetch(`/quizzes/${quizId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ status: "published" }),
    });
    await refresh();
  }

  if (!quiz) {
    return <div className="text-sm text-slate-600">{err ?? "Carregando…"}</div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 hover:underline"
          >
            ← Painel
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{quiz.name}</h1>
          <p className="mt-1 font-mono text-sm text-slate-600">/{quiz.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/quiz/${quiz.slug}`} target="_blank">
            <Button variant="secondary" type="button">
              Preview
            </Button>
          </Link>
          <Button type="button" onClick={publish}>
            Publicar
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Pixels e webhook
        </h2>
        <form onSubmit={savePixels} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Facebook Pixel ID</span>
            <Input name="fb" defaultValue={quiz.facebookPixelId ?? ""} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">
              Google Analytics (measurement ID)
            </span>
            <Input name="ga" defaultValue={quiz.googleAnalyticsId ?? ""} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Google Tag Manager</span>
            <Input name="gtm" defaultValue={quiz.googleTagManagerId ?? ""} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">TikTok Pixel</span>
            <Input name="tt" defaultValue={quiz.tiktokPixelId ?? ""} />
          </label>
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Webhook URL</span>
            <Input
              name="wh"
              defaultValue={quiz.webhookUrl ?? ""}
              placeholder="https://..."
            />
          </label>
          <Button type="submit" className="sm:col-span-2">
            Salvar integrações
          </Button>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => addStep("question")}>
          + Pergunta
        </Button>
        <Button type="button" variant="secondary" onClick={() => addStep("input")}>
          + Captura (input)
        </Button>
        <Button type="button" variant="secondary" onClick={() => addStep("content")}>
          + Conteúdo
        </Button>
        <Button type="button" variant="secondary" onClick={() => addStep("result")}>
          + Etapa resultado (UI)
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {steps.map((step) => (
              <SortStep key={step.id} step={step}>
                <MetadataEditor
                  step={step}
                  onSave={(meta) => updateMetadata(step.id, meta)}
                />
                {step.type === "question" ? (
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        Opções
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => addOption(step.id)}
                      >
                        Adicionar opção
                      </Button>
                    </div>
                    {(optsByStep[step.id] ?? []).map((o) => (
                      <OptionRow
                        key={o.id}
                        quizId={quizId}
                        token={token!}
                        option={o}
                        allSteps={steps}
                        onChanged={refresh}
                      />
                    ))}
                  </div>
                ) : null}
              </SortStep>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Resultados (redirect)</h2>
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={async () => {
              if (!token) return;
              const name = prompt("Nome do resultado?");
              if (!name) return;
              await apiFetch(`/quizzes/${quizId}/results`, token, {
                method: "POST",
                body: JSON.stringify({
                  name,
                  conditions: {},
                  redirectUrl: prompt("URL de redirect (opcional)") || null,
                }),
              });
              await refresh();
            }}
          >
            Novo resultado
          </Button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {results.map((r) => (
            <li key={r.id} className="rounded border border-slate-100 px-3 py-2">
              <span className="font-medium">{r.name}</span>
              {r.redirectUrl ? (
                <span className="ml-2 text-slate-500">→ {r.redirectUrl}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function MetadataEditor({
  step,
  onSave,
}: {
  step: Step;
  onSave: (m: Record<string, unknown>) => void;
}) {
  const [json, setJson] = useState(JSON.stringify(step.metadata ?? {}, null, 2));
  useEffect(() => {
    setJson(JSON.stringify(step.metadata ?? {}, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar só ao trocar de etapa
  }, [step.id]);
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">
        Metadados (título, texto, placeholder). JSON editável.
      </p>
      <textarea
        className="min-h-[120px] w-full rounded border border-slate-200 p-2 font-mono text-xs"
        value={json}
        onChange={(e) => setJson(e.target.value)}
      />
      <Button
        type="button"
        variant="secondary"
        className="text-xs"
        onClick={() => {
          try {
            const parsed = JSON.parse(json) as Record<string, unknown>;
            onSave(parsed);
          } catch {
            alert("JSON inválido");
          }
        }}
      >
        Aplicar metadados
      </Button>
    </div>
  );
}

function OptionRow({
  quizId,
  token,
  option,
  allSteps,
  onChanged,
}: {
  quizId: string;
  token: string;
  option: Option;
  allSteps: Step[];
  onChanged: () => Promise<void>;
}) {
  const [label, setLabel] = useState(option.label);
  const [value, setValue] = useState(option.value);
  const [next, setNext] = useState(option.nextStepId ?? "");

  useEffect(() => {
    setLabel(option.label);
    setValue(option.value);
    setNext(option.nextStepId ?? "");
  }, [option.id, option.label, option.value, option.nextStepId]);

  async function save() {
    await apiFetch(`/quizzes/${quizId}/options/${option.id}`, token, {
      method: "PATCH",
      body: JSON.stringify({
        label,
        value,
        nextStepId: next || null,
      }),
    });
    await onChanged();
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded bg-slate-50 p-2">
      <label className="flex flex-col text-xs">
        Rótulo
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </label>
      <label className="flex flex-col text-xs">
        Valor
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <label className="flex flex-col text-xs">
        Próximo passo
        <select
          className="rounded border border-slate-200 px-2 py-2 text-sm"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        >
          <option value="">(linear)</option>
          {allSteps.map((s) => (
            <option key={s.id} value={s.id}>
              {s.type}…{s.id.slice(0, 6)}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" className="text-xs" onClick={save}>
        Salvar
      </Button>
    </div>
  );
}
