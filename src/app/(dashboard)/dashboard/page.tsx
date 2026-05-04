import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardFunnels from "./dashboard-funnels";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("funnels")
    .select("id,name,slug,published,created_at")
    .order("updated_at", { ascending: false });

  const initial =
    data?.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      published: row.published,
      created_at: row.created_at,
    })) ?? [];

  return <DashboardFunnels initial={initial} />;
}
