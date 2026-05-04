"use server";

import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { createFunnel } from "@/actions/funnels";
import { coerceBlockContent } from "@/lib/schemas/blocks";

export async function seedSampleFunnel(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const funnelId = await createFunnel(name);

  const optLow = nanoid();
  const optHigh = nanoid();

  const introContent = coerceBlockContent("intro", {
    title: name,
    subtitle: "Este é um exemplo pronto.",
    primaryCta: "Começar avaliação",
  });
  const qContent = coerceBlockContent("question_mc", {
    question: "Como avalia o seu nível?",
    helper: "Vamos bifurcar conforme resposta.",
    options: [
      { id: optLow, label: "Começando agora (iniciante)" },
      { id: optHigh, label: "Já domino bem (avançado)" },
    ],
  });
  const outBeginnerContent = coerceBlockContent("outcome", {
    title: "Ótimo, vamos aos fundamentos",
    bodyMarkdown:
      "**Perfil iniciante**\n\n{{lead_name}}, com pontuação {{score}} você entra na trilha básica.\nFinalize com um redirecionamento para WhatsApp ou checkout.",
    showLeadFormBefore: false,
  });
  const outAdvancedContent = coerceBlockContent("outcome", {
    title: "Perfil estratégico",
    bodyMarkdown:
      "**Perfil avançado**\n\n{{lead_name}} — alta pontuação ({{score}}) indica disponibilidade para integrações maiores.",
  });
  const redirectWhatsappContent = coerceBlockContent("redirect", {
    url: "https://wa.me/5511999999999?text=Quero+continuar+meu+funil",
    openInNewTab: true,
    label: "Falar no WhatsApp",
  });

  const { data: inserted, error } = await supabase
    .from("blocks")
    .insert([
      {
        funnel_id: funnelId,
        type: "intro",
        content: introContent,
        sort_order: 10,
        position: { x: 40, y: 40 },
      },
      {
        funnel_id: funnelId,
        type: "question_mc",
        content: qContent,
        sort_order: 20,
        position: { x: 420, y: 40 },
      },
      {
        funnel_id: funnelId,
        type: "outcome",
        content: outBeginnerContent,
        sort_order: 30,
        position: { x: 800, y: -20 },
      },
      {
        funnel_id: funnelId,
        type: "outcome",
        content: outAdvancedContent,
        sort_order: 40,
        position: { x: 800, y: 120 },
      },
      {
        funnel_id: funnelId,
        type: "redirect",
        content: redirectWhatsappContent,
        sort_order: 50,
        position: { x: 1180, y: 40 },
      },
    ])
    .select("id,type");

  if (error) throw new Error(error.message);
  const list = inserted ?? [];
  const byTypeMulti = list.reduce<Record<string, string[]>>((acc, row) => {
    acc[row.type] = acc[row.type] ? [...acc[row.type], row.id] : [row.id];
    return acc;
  }, {});

  const introId = byTypeMulti.intro?.[0];
  const questionId = byTypeMulti.question_mc?.[0];
  const beginnerId = byTypeMulti.outcome?.[0];
  const advancedId = byTypeMulti.outcome?.[1];
  const redirectId = byTypeMulti.redirect?.[0];

  if (!introId || !questionId || !beginnerId || !advancedId || !redirectId)
    throw new Error("Seed incompleto");

  await supabase.from("connections").insert([
    {
      funnel_id: funnelId,
      from_block_id: introId,
      to_block_id: questionId,
      condition: { kind: "default" },
    },
    {
      funnel_id: funnelId,
      from_block_id: questionId,
      to_block_id: beginnerId,
      condition: { kind: "equals", blockId: questionId, value: optLow },
    },
    {
      funnel_id: funnelId,
      from_block_id: questionId,
      to_block_id: advancedId,
      condition: { kind: "equals", blockId: questionId, value: optHigh },
    },
    {
      funnel_id: funnelId,
      from_block_id: beginnerId,
      to_block_id: redirectId,
      condition: { kind: "default" },
    },
    {
      funnel_id: funnelId,
      from_block_id: advancedId,
      to_block_id: redirectId,
      condition: { kind: "default" },
    },
  ]);

  return funnelId;
}
