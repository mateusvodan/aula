"use server";

import { createClient } from "@/lib/supabase/server";
import type { FunnelSettings } from "@/types/funnel";

export async function submitAnalyticsEvent(params: {
  funnelId: string;
  slug: string;
  event_type: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
}) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("funnels")
    .select("id,published,slug")
    .eq("id", params.funnelId)
    .maybeSingle();

  if (!data?.published || data.slug !== params.slug)
    throw new Error("Funil não disponível.");

  const { error } = await supabase.from("analytics_events").insert({
    funnel_id: params.funnelId,
    event_type: params.event_type,
    metadata: params.metadata ?? {},
    session_id: params.session_id ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function submitLead(params: {
  funnelId: string;
  slug: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  answers: Record<string, unknown>;
  session_id?: string;
}) {
  const supabase = await createClient();

  const { data: f } = await supabase
    .from("funnels")
    .select("id,published,slug,settings")
    .eq("id", params.funnelId)
    .maybeSingle();

  if (!f?.published || f.slug !== params.slug) throw new Error("Funil não disponível.");

  const settings = (f.settings ?? {}) as FunnelSettings;

  const { error } = await supabase.from("leads").insert({
    funnel_id: params.funnelId,
    name: params.name ?? null,
    email: params.email ?? null,
    phone: params.phone ?? null,
    answers: params.answers,
    session_id: params.session_id ?? null,
  });
  if (error) throw new Error(error.message);

  await submitAnalyticsEvent({
    funnelId: params.funnelId,
    slug: params.slug,
    event_type: "lead_submit",
    session_id: params.session_id,
    metadata: {},
  }).catch(() => {});

  if (settings.webhook_url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      await fetch(settings.webhook_url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(settings.webhook_secret
            ? { "x-webhook-secret": settings.webhook_secret }
            : {}),
        },
        body: JSON.stringify({
          type: "lead.created",
          funnel_id: params.funnelId,
          lead: {
            name: params.name,
            email: params.email,
            phone: params.phone,
            answers: params.answers,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {
      await supabase.from("analytics_events").insert({
        funnel_id: params.funnelId,
        event_type: "webhook_delivery_failed",
        metadata: {},
        session_id: params.session_id ?? null,
      });
    }
  }
}
