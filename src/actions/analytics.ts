"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchFunnelInsights(funnelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const { data: funnel } = await supabase
    .from("funnels")
    .select("id,user_id,name,slug")
    .eq("id", funnelId)
    .maybeSingle();

  if (!funnel || funnel.user_id !== user.id) throw new Error("Sem acesso.");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: events } = await supabase
    .from("analytics_events")
    .select("event_type,metadata,created_at,session_id")
    .eq("funnel_id", funnelId)
    .gte("created_at", since.toISOString());

  const { count: leadsCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("funnel_id", funnelId);

  const evts = events ?? [];
  const byType = evts.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
    return acc;
  }, {});

  const views = byType["view"] ?? 0;
  const completes = byType["complete"] ?? 0;
  const leadSubmits = byType["lead_submit"] ?? 0;

  const sessions = new Set(
    evts.map((e) => e.session_id).filter(Boolean) as string[]
  );

  /** Contagem rudimentar de escolhas (MC) vindas nos metadados */
  const answerHistogram: Record<string, number> = {};
  for (const e of evts) {
    if (e.event_type !== "answer") continue;
    const md = e.metadata as { block_id?: string; option_id?: string; value?: string } | null;

    const k = `${md?.block_id ?? "?"}:${md?.option_id ?? md?.value ?? "?"}`;
    answerHistogram[k] = (answerHistogram[k] ?? 0) + 1;
  }

  const topAnswers = Object.entries(answerHistogram)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return {
    funnel,
    totals: {
      views,
      completes,
      leadSubmits,
      leadsAllTimeApprox: leadsCount ?? 0,
      uniqueSessions: sessions.size || null,
      completionRate: views ? Math.round((completes / views) * 1000) / 10 : null,
      conversionRate:
        completes && leadSubmits
          ? Math.round((leadSubmits / completes) * 1000) / 10
          : completes
            ? 0
            : null,
      byType,
    },
    recentCount: evts.length,
    topAnswers,
  };
}

export async function listLeadsForFunnel(funnelId: string, limit = 50) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const { data: funnel } = await supabase
    .from("funnels")
    .select("user_id")
    .eq("id", funnelId)
    .maybeSingle();
  if (!funnel || funnel.user_id !== user.id) throw new Error("Sem acesso.");

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("funnel_id", funnelId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
