import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BlockRecord, ConnectionRecord, Funnel } from "@/types/funnel";

export type PublishedPayload = {
  funnel: Omit<Funnel, "user_id"> & { user_id?: string };
  blocks: BlockRecord[];
  connections: ConnectionRecord[];
};

export async function fetchPublishedBySlug(
  slug: string
): Promise<PublishedPayload | null> {
  const supabase = await createClient();

  const { data: funnel, error: e1 } = await supabase
    .from("funnels")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (e1 || !funnel) return null;

  const [{ data: blocks }, { data: connections }] = await Promise.all([
    supabase.from("blocks").select("*").eq("funnel_id", funnel.id).order("sort_order"),
    supabase.from("connections").select("*").eq("funnel_id", funnel.id),
  ]);

  return {
    funnel: funnel as unknown as PublishedPayload["funnel"],
    blocks: (blocks ?? []) as unknown as BlockRecord[],
    connections: (connections ?? []) as unknown as ConnectionRecord[],
  };
}
