import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
          QuizConvert
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Crie funis em formato de quiz com lógica condicional, captura de leads
          e pixels — feito para tráfego pago.
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/login">
          <Button variant="primary">Entrar</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Criar conta</Button>
        </Link>
      </div>
    </div>
  );
}
