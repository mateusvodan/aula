"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishable } from "./publishable";

export function createClient() {
  const { url, anonKey } = getSupabasePublishable();
  return createBrowserClient(url, anonKey);
}
