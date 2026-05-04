"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { resolveNextStepId } from "@/lib/quiz-flow";
import { ensurePixels, trackConversionEvent } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuizPlayerStore } from "@/stores/quiz-player";

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
type Payload = {
  quiz: {
    id: string;
    name: string;
    slug: string;
    facebookPixelId?: string | null;
    googleAnalyticsId?: string | null;
    googleTagManagerId?: string | null;
    tiktokPixelId?: string | null;
  };
  steps: Step[];
  optionsByStep: Record<string, Option[]>;
};

export default function QuizPlayer({ slug }: { slug: string }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [done, setDone] = useState<{
    redirectUrl: string | null;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const sessionId = useQuizPlayerStore((s) => s.sessionId);
  const leadId = useQuizPlayerStore((s) => s.leadId);
  const answers = useQuizPlayerStore((s) => s.answers);
  const setAnswer = useQuizPlayerStore((s) => s.setAnswer);
  const setLeadId = useQuizPlayerStore((s) => s.setLeadId);

  const orderedStepIds = useMemo(() => {
    if (!payload) return [];
    return [...payload.steps]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => s.id);
  }, [payload]);

  const currentStep = useMemo(() => {
    if (!payload || !currentStepId) return null;
    return payload.steps.find((s) => s.id === currentStepId) ?? null;
  }, [payload, currentStepId]);

  useEffect(() => {
    useQuizPlayerStore.getState().resetSession();
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await apiFetch<Payload>(
          `/public/quizzes/${encodeURIComponent(slug)}`,
          null,
        );
        if (cancelled) return;
        setPayload(p);
        const first = [...p.steps].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        )[0];
        setCurrentStepId(first?.id ?? null);
        ensurePixels({
          facebookPixelId: p.quiz.facebookPixelId,
          googleAnalyticsId: p.quiz.googleAnalyticsId,
          googleTagManagerId: p.quiz.googleTagManagerId,
          tiktokPixelId: p.quiz.tiktokPixelId,
        });
        trackConversionEvent("page_view", { slug });

        const sid = useQuizPlayerStore.getState().sessionId;

        await apiFetch("/public/events", null, {
          method: "POST",
          body: JSON.stringify({
            quizId: p.quiz.id,
            type: "page_view",
            sessionId: sid,
            metadata: { slug },
          }),
        });

        const lead = await apiFetch<{ id: string }>("/public/leads", null, {
          method: "POST",
          body: JSON.stringify({
            quizId: p.quiz.id,
            sessionId: sid,
            data: {},
          }),
        });
        if (cancelled) return;
        setLeadId(lead.id);

        await apiFetch("/public/events", null, {
          method: "POST",
          body: JSON.stringify({
            quizId: p.quiz.id,
            type: "quiz_start",
            sessionId: sid,
            metadata: {},
          }),
        });
        trackConversionEvent("quiz_start", {});

        if (first) {
          await apiFetch("/public/events", null, {
            method: "POST",
            body: JSON.stringify({
              quizId: p.quiz.id,
              type: "step_view",
              sessionId: sid,
              metadata: { stepId: first.id },
            }),
          });
        }
      } catch (e: unknown) {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : "Erro ao carregar");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, setLeadId]);

  async function fireStepView(stepId: string) {
    if (!payload) return;
    await apiFetch("/public/events", null, {
      method: "POST",
      body: JSON.stringify({
        quizId: payload.quiz.id,
        type: "step_view",
        sessionId,
        metadata: { stepId },
      }),
    });
  }

  async function goToStep(nextId: string | null) {
    if (!payload || nextId === null) {
      await finalize();
      return;
    }
    setCurrentStepId(nextId);
    await fireStepView(nextId);
  }

  async function finalize() {
    if (!payload || !leadId) return;
    try {
      const { result } = await apiFetch<{
        result: { resultId: string; redirectUrl: string | null } | null;
      }>(`/public/quizzes/${encodeURIComponent(slug)}/complete`, null, {
        method: "POST",
        body: JSON.stringify({
          leadId,
          sessionId,
          answers,
          score: 0,
        }),
      });
      trackConversionEvent("quiz_completed", {
        resultId: result?.resultId,
      });
      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      setDone({ redirectUrl: result?.redirectUrl ?? null });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao finalizar");
    }
  }

  async function onSelectOption(stepId: string, value: string) {
    if (!payload) return;
    setAnswer(stepId, value);
    await apiFetch("/public/events", null, {
      method: "POST",
      body: JSON.stringify({
        quizId: payload.quiz.id,
        type: "answer_selected",
        sessionId,
        metadata: { stepId, value },
      }),
    });
    trackConversionEvent("answer_selected", { stepId, value });

    const opts = (payload.optionsByStep[stepId] ?? []).map((o) => ({
      value: o.value,
      nextStepId: o.nextStepId,
    }));
    const next = resolveNextStepId(
      opts,
      value,
      orderedStepIds,
      stepId,
    );
    await goToStep(next);
  }

  if (err) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center text-red-600">
        {err}
      </div>
    );
  }

  if (!payload || !currentStep) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center text-slate-600">
        Carregando quiz…
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">
          Obrigado!
        </h1>
        <p className="mt-4 text-slate-600">Seu resultado foi registrado.</p>
      </div>
    );
  }

  const meta = currentStep.metadata;
  const title = String(meta.title ?? meta.headline ?? "Etapa");
  const body = meta.body ? String(meta.body) : null;

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-16">
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {payload.quiz.name}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        {body ? (
          <p className="mt-4 text-slate-600 leading-relaxed">{body}</p>
        ) : null}

        {currentStep.type === "question" ? (
          <div className="mt-8 flex flex-col gap-3">
            {(payload.optionsByStep[currentStep.id] ?? [])
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((o) => (
                <Button
                  key={o.id}
                  type="button"
                  variant="secondary"
                  className="w-full justify-start py-3 text-left"
                  onClick={() => onSelectOption(currentStep.id, o.value)}
                >
                  {o.label}
                </Button>
              ))}
          </div>
        ) : null}

        {currentStep.type === "input" ? (
          <InputStepForm
            step={currentStep}
            onSubmit={async (value) => {
              const field = String(currentStep.metadata.field ?? "email");
              setAnswer(currentStep.id, value);
              await apiFetch("/public/events", null, {
                method: "POST",
                body: JSON.stringify({
                  quizId: payload.quiz.id,
                  type: "lead_submitted",
                  sessionId,
                  metadata: { stepId: currentStep.id, field },
                }),
              });
              trackConversionEvent("lead_submitted", {
                stepId: currentStep.id,
              });
              const idx = orderedStepIds.indexOf(currentStep.id);
              const next =
                idx >= 0 && idx < orderedStepIds.length - 1
                  ? orderedStepIds[idx + 1]!
                  : null;
              await goToStep(next);
            }}
          />
        ) : null}

        {currentStep.type === "content" ? (
          <div className="mt-8">
            <Button
              type="button"
              onClick={async () => {
                await apiFetch("/public/events", null, {
                  method: "POST",
                  body: JSON.stringify({
                    quizId: payload.quiz.id,
                    type: "cta_clicked",
                    sessionId,
                    metadata: { stepId: currentStep.id },
                  }),
                });
                trackConversionEvent("cta_clicked", {
                  stepId: currentStep.id,
                });
                const idx = orderedStepIds.indexOf(currentStep.id);
                const next =
                  idx >= 0 && idx < orderedStepIds.length - 1
                    ? orderedStepIds[idx + 1]!
                    : null;
                await goToStep(next);
              }}
            >
              Continuar
            </Button>
          </div>
        ) : null}

        {currentStep.type === "result" ? (
          <div className="mt-8">
            <Button type="button" onClick={() => finalize()}>
              Concluir
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InputStepForm({
  step,
  onSubmit,
}: {
  step: Step;
  onSubmit: (value: string) => Promise<void>;
}) {
  const field = String(step.metadata.field ?? "email");
  const placeholder = String(step.metadata.placeholder ?? "");
  const label = String(step.metadata.label ?? field);
  const { register, handleSubmit } = useForm<{ v: string }>();

  return (
    <form
      className="mt-8 flex flex-col gap-4"
      onSubmit={handleSubmit(async (data) => {
        await onSubmit(data.v);
      })}
    >
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        {label}
        <Input
          {...register("v", { required: true })}
          placeholder={placeholder}
          type={field.includes("email") ? "email" : "text"}
        />
      </label>
      <Button type="submit">Continuar</Button>
    </form>
  );
}
