import { z } from "zod";
import type { BlockType } from "@/types/funnel";

const baseContent = z.record(z.string(), z.unknown());

export const introContentSchema = z.object({
  title: z.string().default("Olá"),
  subtitle: z.string().optional(),
  primaryCta: z.string().default("Começar"),
});

export const questionMcSchema = z.object({
  question: z.string(),
  helper: z.string().optional(),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
      })
    )
    .default([]),
});

export const questionSingleSchema = z.object({
  question: z.string(),
  optionLabel: z.string().default("Continuar"),
});

export const questionTextSchema = z.object({
  question: z.string(),
  placeholder: z.string().optional(),
  captureAs: z.enum(["lead_name", "lead_email", "lead_phone", "custom"]).optional(),
  captureKey: z.string().optional(),
});

export const questionImageSchema = z.object({
  question: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        imageUrl: z.string(),
        alt: z.string().optional(),
      })
    )
    .default([]),
});

export const transitionSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  cta: z.string().default("Continuar"),
});

export const outcomeSchema = z.object({
  title: z.string().default("Seu resultado"),
  bodyMarkdown: z.string().default(
    "Obrigado, {{lead_name}}! Sua pontuação: {{score}}. Perfil: **{{profile}}**."
  ),
  showLeadFormBefore: z.boolean().default(false),
});

export const redirectSchema = z.object({
  url: z.string(),
  openInNewTab: z.boolean().default(false),
  label: z.string().optional(),
});

export function coerceBlockContent(
  type: BlockType | string,
  raw: Record<string, unknown>
): Record<string, unknown> {
  const parse = (
    schema: z.ZodType<Record<string, unknown>>,
    def: Record<string, unknown>
  ) => schema.safeParse({ ...def, ...raw }).data ?? def;

  switch (type as BlockType) {
    case "intro":
      return parse(introContentSchema, { title: "Intro", primaryCta: "Começar" });
    case "question_mc":
      return parse(questionMcSchema, { question: "Pergunta?", options: [] });
    case "question_single":
      return parse(questionSingleSchema, {
        question: "Pronto?",
        optionLabel: "Sim",
      });
    case "question_text":
      return parse(questionTextSchema, { question: "Responda:" });
    case "question_image":
      return parse(questionImageSchema, { question: "Escolha:" });
    case "transition":
      return parse(transitionSchema, { cta: "Continuar" });
    case "outcome":
      return parse(outcomeSchema, {});
    case "redirect":
      return parse(redirectSchema, { url: "https://example.com" });
    default:
      return baseContent.parse(raw);
  }
}
