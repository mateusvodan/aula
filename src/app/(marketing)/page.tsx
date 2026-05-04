import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Layers, LineChart, MousePointerClick } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 -top-48 h-[480px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-20 sm:px-6 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-xl space-y-6">
            <p className="inline-flex rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              Funis inteligentes, estilo Stripe + Notion
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Construa quizzes com lógica condicional que convertem.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Crie fluxos guiados por respostas, capture leads premium e publique em
              segundos com URL pública otimizada.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="rounded-full px-8 shadow-lg shadow-primary/30"
                >
                  Criar conta
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="rounded-full px-7">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>
          <Card className="relative w-full max-w-md shrink-0 border-border/70 shadow-xl">
            <CardHeader className="gap-2">
              <CardTitle className="text-xl">Painel rápido</CardTitle>
              <CardDescription>
                Builder visual • Supabase Auth • páginas públicas responsivas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
        {[
          {
            icon: MousePointerClick,
            title: "UX premium",
            body: "Cartões suaves, microinterações e foco mobile-first.",
          },
          {
            icon: Layers,
            title: "Lógica real",
            body: "If/Else por resposta, texto dinâmico e redirecionamentos.",
          },
          {
            icon: LineChart,
            title: "Métricas claras",
            body: "Visualizações, conclusão e distribuição de respostas.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <Card key={title} className="border-border/70 shadow-md">
            <CardHeader className="space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="leading-relaxed">{body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
