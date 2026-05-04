const CONFIG_HINT =
  "Crie `.env.local` na raiz (ex.: `cp .env.example .env.local`) e preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY com Dashboard → Settings → API. Use a chave anon (public), não a service_role.";

/** URL + anon key para cliente browser, Server Components e middleware. */
export function getSupabasePublishable(): { url: string; anonKey: string } {
  const resolved = getSupabasePublishableOptional();
  if (!resolved) {
    throw new Error(`Supabase: ${CONFIG_HINT}`);
  }
  return resolved;
}

export function getSupabasePublishableOptional():
  | { url: string; anonKey: string }
  | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
