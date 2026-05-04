"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { coerceBlockContent } from "@/lib/schemas/blocks";
import type { BlockType } from "@/types/funnel";

export async function addBlock(input: {
  funnelId: string;
  type: BlockType | string;
  sortOrder?: number;
  position?: { x: number; y: number };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  let sortOrder = input.sortOrder ?? 0;
  if (input.sortOrder === undefined) {
    const { data: maxRow } = await supabase
      .from("blocks")
      .select("sort_order")
      .eq("funnel_id", input.funnelId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (maxRow?.sort_order ?? 0) + 1;
  }

  const content = coerceBlockContent(input.type, {});
  const { data, error } = await supabase
    .from("blocks")
    .insert({
      funnel_id: input.funnelId,
      type: input.type,
      content,
      sort_order: sortOrder,
      position: input.position ?? { x: sortOrder * 40, y: sortOrder * 80 },
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/funnels/${input.funnelId}/edit`);
  return data!.id as string;
}

export async function updateBlock(
  id: string,
  patch: Partial<{
    content: Record<string, unknown>;
    sort_order: number;
    position: { x?: number; y?: number };
  }>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const { error } = await supabase
    .from("blocks")
    .update({
      ...patch,
      ...(patch.position ? { position: patch.position } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBlock(blockId: string, funnelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const { error } = await supabase.from("blocks").delete().eq("id", blockId);
  if (error) throw new Error(error.message);

  await supabase.from("connections").delete().eq("from_block_id", blockId);
  await supabase.from("connections").delete().eq("to_block_id", blockId);

  revalidatePath(`/dashboard/funnels/${funnelId}/edit`);
}

export async function upsertConnections(
  funnelId: string,
  edges: Array<{
    id?: string | null;
    from_block_id: string;
    to_block_id: string;
    condition: Record<string, unknown>;
  }>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  await supabase.from("connections").delete().eq("funnel_id", funnelId);

  if (edges.length === 0) {
    revalidatePath(`/dashboard/funnels/${funnelId}/edit`);
    return;
  }

  const { error } = await supabase.from("connections").insert(
    edges.map((e) => ({
      funnel_id: funnelId,
      from_block_id: e.from_block_id,
      to_block_id: e.to_block_id,
      condition: e.condition,
    }))
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/funnels/${funnelId}/edit`);
}

export async function loadFunnelStructure(funnelId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const funnel = await supabase.from("funnels").select("*").eq("id", funnelId).maybeSingle();
  if (!funnel.data || funnel.data.user_id !== user.id) throw new Error("Funil inválido.");

  const [{ data: blocks }, { data: connections }] = await Promise.all([
    supabase.from("blocks").select("*").eq("funnel_id", funnelId).order("sort_order"),
    supabase.from("connections").select("*").eq("funnel_id", funnelId),
  ]);

  return { funnel: funnel.data, blocks: blocks ?? [], connections: connections ?? [] };
}
