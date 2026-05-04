"use client";

import Link from "next/link";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { submitAnalyticsEvent, submitLead } from "@/actions/public-funnel";
import {
  collectScoreFromAnswers,
  getEntryBlock,
  interpolateTemplate,
  resolveNextBlockId,
} from "@/lib/funnel-engine/navigation";
import type { BlockRecord, ConnectionRecord, FunnelSettings } from "@/types/funnel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type RuntimeProps = {
  slug: string;

  funnel: { id: string; name: string; settings: FunnelSettings | null };
  blocks: BlockRecord[];

  connections: ConnectionRecord[];

};

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-primary/14 via-muted/55 to-muted">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pb-10 pt-12 text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Funquiz
        </Link>
        <span className="truncate text-right">{title}</span>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20">{children}</main>
    </div>
  );
}

function liteMd(copy: string) {
  const parts = copy.split(/\*\*/);
  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <strong key={`${idx}-${part.slice(0, 16)}`}>{part}</strong>
    ) : (
      <span key={`${idx}-${part.slice(0, 16)}`} className="whitespace-pre-line">
        {part}
      </span>
    )
  );
}

function LeadFields(props: {
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  setLeadName: (value: string) => void;
  setLeadEmail: (value: string) => void;
  setLeadPhone: (value: string) => void;
}) {
  return (
    <div className="space-y-4 text-left">
      <div className="space-y-2">
        <label className="text-xs uppercase text-muted-foreground" htmlFor="runtime-name">
          Nome
        </label>
        <Input id="runtime-name" value={props.leadName} onChange={(e) => props.setLeadName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase text-muted-foreground" htmlFor="runtime-email">
          Email
        </label>
        <Input
          id="runtime-email"
          type="email"
          value={props.leadEmail}
          onChange={(e) => props.setLeadEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase text-muted-foreground" htmlFor="runtime-phone">
          Telefone
        </label>
        <Input id="runtime-phone" value={props.leadPhone} onChange={(e) => props.setLeadPhone(e.target.value)} />
      </div>
    </div>
  );
}

function RedirectGate(props: { url: string; settings: FunnelSettings }) {
  const ran = useRef(false);

  useEffect(() => {
    if (!props.url || ran.current) return;
    ran.current = true;
    window.location.assign(props.url);
  }, [props.url]);

  const wa = props.settings.whatsapp_phone
    ? props.settings.whatsapp_phone.replace(/\D+/g, "")
    : "";

  return (
    <Shell title="Encaminhamento">
      <Card className="border-border shadow-lg">
        <CardContent className="space-y-4 p-8 text-center text-sm text-muted-foreground">
          <p>Estamos a abrir a página configurada.</p>
          <div className="space-y-2">
            <Button className="w-full rounded-full" type="button" onClick={() => window.open(props.url, "_blank")}>
              Tentar novamente manualmente
            </Button>
            <Link href="/">
              <Button className="w-full rounded-full" type="button" variant="outline">
                Voltar ao Funquiz
              </Button>
            </Link>
            {props.settings.checkout_base_url ? (
              <Link href={`${props.settings.checkout_base_url}`} target="_blank">
                <Button className="w-full rounded-full" type="button" variant="outline">
                  Checkout configurado
                </Button>
              </Link>
            ) : null}
            {wa ? (
              <Link href={`https://wa.me/${wa}`} target="_blank">
                <Button className="w-full rounded-full" type="button" variant="outline">
                  WhatsApp
                </Button>
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}

export default function PublicRuntime(props: RuntimeProps) {
  const settings = useMemo(
    () => (props.funnel.settings ?? {}) as FunnelSettings,
    [props.funnel.settings]
  );

  const entry = useMemo(() => getEntryBlock(props.blocks), [props.blocks]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentId, setCurrentId] = useState(entry?.id ?? "");

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const key = `fq_session:${props.funnel.id}`;
      if (!window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, nanoid());
      }
    } catch {
      //
    }
  }, [props.funnel.id]);

  const sessionRead = () => {
    try {
      const key = `fq_session:${props.funnel.id}`;
      if (typeof window === "undefined") return undefined;
      return window.localStorage.getItem(key) ?? undefined;
    } catch {
      return undefined;
    }
  };

  const trace = useCallback(
    async (event_type: string, metadata: Record<string, unknown>) => {
      await submitAnalyticsEvent({
        funnelId: props.funnel.id,
        slug: props.slug,
        session_id: sessionRead(),
        event_type,
        metadata,
      }).catch(() => {});
    },
    [props.funnel.id, props.slug]
  );

  useEffect(() => {
    void trace("view", {});
  }, [trace]);

  const current =
    props.blocks.find((blk) => blk.id === currentId) ??
    ({
      id: "missing",
      type: "transition",
      funnel_id: props.funnel.id,
      sort_order: 0,
      position: {},
      content: { title: "Funil incompleto", subtitle: "", primaryCta: "Voltar" },
    } as unknown as BlockRecord);

  useEffect(() => {
    void trace("step_view", {
      block: current.id,
      type: current.type,
    });
  }, [current.id, current.type, trace]);

  useEffect(() => {
    setOutcomePrimed(false);
  }, [currentId]);

  const [draftInput, setDraftInput] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [outcomePrimed, setOutcomePrimed] = useState(false);

  const interpolationBag = (): Record<string, string | number> => {
    const numericScore = collectScoreFromAnswers({ ...(answers as unknown as Record<string, unknown>) });
    return {
      ...answers,
      lead_name: leadName,
      lead_email: leadEmail,
      lead_phone: leadPhone,
      score: numericScore,
      profile: numericScore >= 4 ? "avançado" : "fundamentos",
    };
  };

  async function captureLead(skip: boolean) {
    if (skip) return;
    await submitLead({
      funnelId: props.funnel.id,
      slug: props.slug,
      name: leadName || null,
      email: leadEmail.trim() === "" ? null : leadEmail,
      phone: leadPhone.trim() === "" ? null : leadPhone,
      answers: { ...answers },
      session_id: sessionRead(),
    });
    toast.success("Obrigado!");
    await trace("lead_submit", { scope: current.id });
  }

  async function navigateFrom(blockId: string, merged: Record<string, string>) {


    await trace("answer", {
      block_id: blockId,
      value: merged[blockId] ?? "",
    });
    const next = resolveNextBlockId(blockId, props.connections, merged);

    setAnswers(merged);
    setDraftInput("");

    if (next) {
      setCurrentId(next);
      return;
    }

    toast.success("Quiz concluído!");
    await trace("complete", {});
    setCurrentId("");
  }

  if (!entry) {
    return (
      <Shell title={props.funnel.name}>
        <Card>
          <CardContent className="space-y-4 p-8 text-center text-sm">
            Este funil ainda não está publicável.
            <div>
              <Link href="/">
                <Button className="rounded-full px-12"> Voltar ao site </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  switch (String(current.type)) {
    case "intro":
    case "transition":
      const hero = current.content as Record<string, unknown>;

      const title =
        typeof hero.title === "string"
          ? hero.title
          : typeof hero.question === "string"
            ? hero.question
            : props.funnel.name;

      const subtitle = typeof hero.subtitle === "string" ? hero.subtitle : "";
      const narration = typeof hero.body === "string" ? hero.body : "";
      const cta =
        typeof hero.primaryCta === "string"
          ? hero.primaryCta
          : typeof hero.cta === "string"
            ? hero.cta
            : "Começar";

      return (
        <Shell title={props.funnel.name}>
          <Card className="border-border shadow-xl">
            <CardContent className="space-y-8 p-10 text-center">
              <p className="text-[11px] uppercase tracking-[0.45em] text-primary">Quiz</p>
              <h1 className="text-4xl font-semibold leading-snug">{title}</h1>
              {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
              {narration ? (
                <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{narration}</div>
              ) : null}
              <Button
                type="button"
                className="rounded-full px-12 py-7 text-xl"
                onClick={() => void navigateFrom(current.id, { ...answers })}
              >
                {cta}
              </Button>
            </CardContent>
          </Card>
        </Shell>
      );

    case "question_mc":
      const mcContent = current.content as {
        question?: string;
        options?: Array<{ id: string; label: string }>;
      };
      return (
        <Shell title={props.funnel.name}>
          <Card className="border-border shadow-xl">
            <CardContent className="space-y-5 p-8">
              <p className="text-2xl font-semibold">{mcContent.question ?? "Escolhe uma opção"}</p>
              <div className="grid gap-3">
                {(mcContent.options ?? []).map((opt) => (
                  <Button
                    variant="secondary"
                    key={opt.id}
                    type="button"
                    className="h-auto rounded-3xl px-6 py-5 text-left text-base"
                    onClick={() =>
                      void navigateFrom(current.id, {
                        ...answers,
                        [current.id]: opt.id,
                        __score: String((Number(answers.__score ?? 0) || 0) + 1),
                      })
                    }
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </Shell>
      );

    case "question_single":
      const singleCopy = current.content as { question?: string; optionLabel?: string };

      const optionLabelChoice = typeof singleCopy.optionLabel === "string" ? singleCopy.optionLabel : "Continuar";

      return (
        <Shell title={props.funnel.name}>
          <Card className="border-border shadow-xl">
            <CardContent className="space-y-6 p-10 text-center">
              <p className="text-3xl font-semibold">{singleCopy.question ?? "Podemos prosseguir?"}</p>

              <Button
                type="button"
                className="rounded-full px-14 py-7 text-xl"

                onClick={() =>
                  void navigateFrom(current.id, {
                    ...answers,
                    [current.id]: optionLabelChoice,
                  })
                }

              >
                {optionLabelChoice}
              </Button>
            </CardContent>
          </Card>
        </Shell>
      );

    case "question_text":
      const textual = current.content as {

        question?: string;
        placeholder?: string;
        captureAs?: string;
      };

      return (
        <Shell title={props.funnel.name}>
          <Card className="border-border shadow-xl">

            <CardContent className="space-y-4 p-8">
              <p className="text-2xl font-semibold">{textual.question ?? "Responda"}</p>
              <Input
                placeholder={textual.placeholder ?? ""}
                className="h-14 rounded-2xl"
                value={draftInput}
                onChange={(evt) => setDraftInput(evt.target.value)}
              />
              <Button
                type="button"
                disabled={draftInput.trim().length === 0}
                className="w-full rounded-2xl"
                onClick={() => {
                  const clean = draftInput.trim();
                  const payload = {
                    ...answers,
                    [current.id]: clean,
                  };
                  if (textual.captureAs === "lead_name") setLeadName(clean);
                  if (textual.captureAs === "lead_email") setLeadEmail(clean);
                  if (textual.captureAs === "lead_phone") setLeadPhone(clean);
                  void navigateFrom(current.id, payload);
                }}
              >
                Enviar
              </Button>
            </CardContent>
          </Card>
        </Shell>
      );

    case "question_image":
      const gallery = current.content as {
        question?: string;

        options?: Array<{ id: string; imageUrl: string; alt?: string }>;
      };

      return (
        <Shell title={props.funnel.name}>
          <Card className="border-border shadow-xl">

            <CardContent className="space-y-5 p-6">
              <p className="text-xl font-semibold">{gallery.question ?? "Escolhe uma imagem"}</p>

              <div className="grid gap-4 sm:grid-cols-2">

                {(gallery.options ?? []).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="rounded-3xl border border-border bg-muted/30 p-2 text-left hover:border-primary"
                    onClick={() =>
                      void navigateFrom(current.id, {
                        ...answers,
                        [current.id]: item.id,
                        __score: String((Number(answers.__score ?? 0) || 0) + 2),
                      })

                    }


                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading="lazy"
                      src={item.imageUrl}
                      alt={item.alt ?? ""}
                      className="aspect-video w-full rounded-2xl object-cover"
                    />
                  </button>
                ))}
              </div>
            </CardContent>


          </Card>
        </Shell>
      );

    case "outcome":
      const finaleBlock = current.content as {

        title?: string;
        bodyMarkdown?: string;
        showLeadFormBefore?: boolean;
      };

      const bodyCopy = liteMd(interpolateTemplate(String(finaleBlock.bodyMarkdown ?? "Obrigado!"), interpolationBag()));

      const needsGate = finaleBlock.showLeadFormBefore ?? false;


      async function gatedSubmit(skipLead: boolean) {
        if (needsGate && !skipLead) {
          if (!leadEmail.includes("@")) {

            toast.error("Email válido obrigatório");

            return;
          }


          await captureLead(false);



        }



        setOutcomePrimed(true);
      }

      async function secondaryLead(skip: boolean) {
        await captureLead(skip);
        await navigateFrom(current.id, {
          ...answers,
          lead_name: leadName,
          lead_email: leadEmail,

          lead_phone: leadPhone,
        });


      }



      if (needsGate && !outcomePrimed) {
        return (
          <Shell title={props.funnel.name}>
            <Card className="border-border shadow-xl">
              <CardContent className="space-y-6 p-8 text-center">
                <p className="text-3xl font-semibold">{finaleBlock.title ?? "Últimos dados"}</p>
                <p className="text-sm text-muted-foreground">Completa antes de revelarmos os resultados premium.</p>
                <LeadFields
                  {...{
                    leadName,
                    leadEmail,
                    leadPhone,

                    setLeadName,

                    setLeadEmail,
                    setLeadPhone,
                  }}
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1 rounded-full" type="button" onClick={() => void gatedSubmit(false)}>
                    Continuar
                  </Button>
                  <Button className="flex-1 rounded-full" type="button" variant="outline" onClick={() => void gatedSubmit(true)}>
                    Ignorar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Shell>
        );


      }



      return (
        <Shell title={props.funnel.name}>
          <Card className="border-border shadow-xl">
            <CardContent className="space-y-8 p-8">
              <h2 className="text-center text-3xl font-semibold">{finaleBlock.title ?? props.funnel.name}</h2>
              <div className="text-center text-base leading-relaxed text-muted-foreground">{bodyCopy}</div>


              <div className="space-y-4 rounded-3xl border border-muted bg-muted/20 p-4">
                <p className="text-sm font-semibold text-center text-primary">Últimos contactos opcionais</p>
                <LeadFields {...{ leadName, leadEmail, leadPhone, setLeadName, setLeadEmail, setLeadPhone }} />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1 rounded-full" type="button" onClick={() => void secondaryLead(false)}>
                    Guardar dados
                  </Button>
                  <Button className="flex-1 rounded-full" type="button" variant="outline" onClick={() => void secondaryLead(true)}>
                    Continuar sem partilhar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Shell>
      );

    case "redirect": {
      const destination = typeof (current.content as Record<string, unknown>).url === "string"
        ? String((current.content as { url?: string }).url ?? "")
        : "";
      return <RedirectGate url={destination} settings={settings} />;
    }

    default:
      return (
        <Shell title={props.funnel.name}>
          <Card>
            <CardContent className="space-y-4 p-10 text-center text-sm">
              Etapa especial em construção.
              <Button className="rounded-full px-8" type="button" onClick={() => void navigateFrom(current.id, { ...answers })}>
                Tentar ignorar bloqueio
              </Button>
            </CardContent>
          </Card>
        </Shell>
      );


  }



}

