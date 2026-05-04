import { createBrowserClient } from "@supabase/ssr";

const placeholderUrl = "http://127.0.0.1:54321";
const placeholderKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.build-placeholder-signature";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? placeholderUrl;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? placeholderKey;
  return createBrowserClient(url, key);
}
