"use server";

import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import type { FunnelSettings } from "@/types/funnel";

const slugNano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

async function uniqueSlug(): Promise<string> {
  const supabase = await createClient();
  for (let i = 0; i < 8; i++) {
    const candidate = slugNano();
    const { data } = await supabase
      .from("funnels")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return slugNano() + slugNano();
}

export async function createFunnel(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const slug = await uniqueSlug();
  const { data, error } = await supabase
    .from("funnels")
    .insert({ user_id: user.id, name, slug, published: false })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  return data.id as string;
}

export async function listFunnelsForUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const { data, error } = await supabase
    .from("funnels")
    .select("id,name,slug,published,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFunnelById(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const { data, error } = await supabase
    .from("funnels")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.user_id !== user.id) throw new Error("Funil não encontrado.");
  return data;
}

export async function updateFunnelMeta(id: string, patch: Partial<{ name: string; published: boolean; settings: FunnelSettings }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const { error } = await supabase
    .from("funnels")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/funnels/${id}/edit`);
}

export async function deleteFunnel(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const { error } = await supabase.from("funnels").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

function remapCondition(
  raw: unknown,
  idMap: Map<string, string>
): Record<string, unknown> {
  const c = raw as Record<string, unknown> | null | undefined;
  if (!c || typeof c !== "object") return { kind: "default" };
  const next = { ...c };
  const bid =
    typeof next.blockId === "string" ? (next.blockId as string) : undefined;
  if (bid && idMap.has(bid)) next.blockId = idMap.get(bid);
  return next;
}

export async function cloneFunnel(sourceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado.");

  const funnel = await getFunnelById(sourceId);
  const slug = await uniqueSlug();
  const { data: newF, error: e1 } = await supabase
    .from("funnels")
    .insert({
      user_id: user.id,
      name: `${funnel.name} (cópia)`,
      slug,
      published: false,
      settings: funnel.settings ?? {},
    })
    .select("id")
    .single();
  if (e1) throw new Error(e1.message);

  const newFunnelId = newF.id as string;

  const { data: blocks, error: e2 } = await supabase
    .from("blocks")
    .select("*")
    .eq("funnel_id", sourceId)
    .order("sort_order", { ascending: true });
  if (e2) throw new Error(e2.message);

  const idMap = new Map<string, string>();
  for (const b of blocks ?? []) {
    const oldId = b.id as string;
    const { data: inserted, error: eIns } = await supabase
      .from("blocks")
      .insert({
        funnel_id: newFunnelId,
        type: b.type,
        content: b.content,
        sort_order: b.sort_order,
        position: b.position ?? { x: 0, y: 0 },
      })
      .select("id")
      .single();
    if (eIns) throw new Error(eIns.message);
    idMap.set(oldId, inserted!.id as string);
  }

  const { data: conns, error: e4 } = await supabase.from("connections").select("*").eq("funnel_id", sourceId);
  if (e4) throw new Error(e4.message);

  for (const c of conns ?? []) {
    const fb = idMap.get(c.from_block_id as string);
    const tb = idMap.get(c.to_block_id as string);
    if (!fb || !tb) continue;
    await supabase.from("connections").insert({
      funnel_id: newFunnelId,
      from_block_id: fb,
      to_block_id: tb,
      condition: remapCondition(c.condition, idMap),
    });
  }

  revalidatePath("/dashboard");
  return newFunnelId;
}
