"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ClipboardCopy,
  ExternalLink,
  LineChartIcon,
  Pencil,
  Plus,
  Trash2,
  CopyPlus,
  Sparkles,
} from "lucide-react";

import {
  cloneFunnel,
  createFunnel,
  deleteFunnel,
  updateFunnelMeta,
} from "@/actions/funnels";
import { seedSampleFunnel } from "@/actions/templates";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type FunnelListItem = {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  created_at: string;
};

export default function DashboardFunnels({ initial }: { initial: FunnelListItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  function refreshRouter() {
    router.refresh();
  }

  function createEmpty() {
    if (!name.trim()) {
      toast.error("Dê um nome ao funil.");
      return;
    }
    startTransition(async () => {
      try {
        await createFunnel(name.trim());
        toast.success("Funil criado.");
        setName("");
        setOpen(false);
        refreshRouter();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao criar funil");
      }
    });
  }

  function createWithTemplate() {
    const label = name.trim() || "Funil exemplo";
    startTransition(async () => {
      try {
        await seedSampleFunnel(label);
        toast.success("Template criado com blocos exemplo.");
        setName("");
        setOpen(false);
        refreshRouter();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao criar template");
      }
    });
  }

  function togglePublish(f: FunnelListItem, next: boolean) {
    startTransition(async () => {
      try {
        await updateFunnelMeta(f.id, { published: next });
        setItems((prev) =>
          prev.map((item) =>
            item.id === f.id ? { ...item, published: next } : item
          )
        );
        toast.success(next ? "Funil público!" : "Funil foi despublicado.");
        refreshRouter();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      try {
        await deleteFunnel(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success("Funil eliminado.");
        refreshRouter();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  function duplicate(id: string) {
    startTransition(async () => {
      try {
        await cloneFunnel(id);
        toast.success("Cópia criada.");
        refreshRouter();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Painel
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Os seus funis</h1>
          <p className="max-w-xl text-muted-foreground">
            Crie quizzes com lógica condicional e publique com{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/q/slug</code>.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className={cn(
              buttonVariants(),
              "rounded-full shadow-lg shadow-primary/25 gap-1.5",
            )}
          >
            <Plus className="size-4" />
            Novo funil
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo funil</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Nome interno"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <DialogFooter className="gap-3 sm:flex-row sm:justify-end">
              <DialogClose
                type="button"
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Cancelar
              </DialogClose>
              <Button disabled={pending} type="button" onClick={createEmpty}>
                Criar vazio
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={createWithTemplate}
              >
                <Sparkles className="size-4" />
                Usar template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(items?.length ?? 0) === 0 ? (
          <Card className="border-dashed md:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Ainda não tem funis</CardTitle>
              <CardDescription>
                Crie o primeiro projeto ou use um template guiado para começar.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        {items?.map((f) => (
          <Card key={f.id} className="shadow-md shadow-black/5">
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{f.name}</CardTitle>
                  {f.published ? (
                    <Badge className="rounded-full">público</Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full">
                      rascunho
                    </Badge>
                  )}
                </div>
                <CardDescription className="font-mono text-xs">/q/{f.slug}</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
                >
                  Menu
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(
                        `${window.location.origin}/q/${f.slug}`
                      );
                      toast.success("URL copiada");
                    }}
                  >
                    <ClipboardCopy className="size-4" />
                    Copiar URL pública
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      window.open(`/q/${f.slug}`, "_blank");
                    }}
                  >
                    <ExternalLink className="size-4" />
                    Abrir página pública
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      duplicate(f.id);
                    }}
                  >
                    <CopyPlus className="size-4" />
                    Clonar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      if (confirm("Eliminar definitivamente?")) remove(f.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href={`/dashboard/funnels/${f.id}/edit`}>
                <Button variant="secondary" size="sm" className="rounded-full">
                  <Pencil className="size-4" />
                  Editar
                </Button>
              </Link>
              <Link href={`/dashboard/funnels/${f.id}/analytics`}>
                <Button variant="outline" size="sm" className="rounded-full">
                  <LineChartIcon className="size-4" />
                  Analytics
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                disabled={pending}
                type="button"
                onClick={() => togglePublish(f, !f.published)}
              >
                {f.published ? "Despublicar" : "Publicar"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
