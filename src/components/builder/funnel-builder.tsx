"use client";

import "@xyflow/react/dist/style.css";

import { ChangeEvent, useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
} from "@xyflow/react";

import {
  addBlock,
  deleteBlock,
  loadFunnelStructure,
  updateBlock,
  upsertConnections,
} from "@/actions/blocks";
import { updateFunnelMeta } from "@/actions/funnels";
import { normalizeCondition } from "@/lib/funnel-engine/navigation";
import type {
  BlockRecord,
  ConnectionRecord,
  FunnelSettings,
  BlockType,
  RouteCondition,
} from "@/types/funnel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FlowProps = {
  funnelId: string;
  funnel: {
    id: string;
    name: string;
    slug: string;
    published: boolean;
    settings: Record<string, unknown> | null;
  };
  initialBlocks: BlockRecord[];
  initialConnections: ConnectionRecord[];
};

type FlowNodeData = { label: string; blockType: string };

function BlockFlowNode({ data }: { data: FlowNodeData }) {
  return (
    <div className="min-w-[160px] rounded-2xl border border-border bg-card px-4 py-3 text-xs shadow-lg shadow-black/5">
      <Handle
        type="target"
        position={Position.Top}
        className="!size-2 !border-2 !border-background !bg-primary"
      />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
        {data.blockType}
      </p>
      <p className="mt-1 text-sm font-medium leading-snug">{data.label}</p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2 !border-2 !border-background !bg-primary"
      />
    </div>
  );
}

const nodeTypes = { block: BlockFlowNode };

export default function FunnelBuilder(props: FlowProps) {
  return (
    <ReactFlowProvider>
      <Workbench {...props} />
    </ReactFlowProvider>
  );
}

function blocksToNodes(blocks: BlockRecord[]) {
  return blocks.map((b, idx) => {
    const c = (b.content ?? {}) as Record<string, unknown>;
    const label =
      (typeof c.question === "string" && (c.question as string)) ||
      (typeof c.title === "string" && (c.title as string)) ||
      String(b.type);
    const pos =
      typeof b.position === "object" && b.position !== null
        ? (b.position as { x?: number; y?: number })
        : {};
    const x = Number(pos.x ?? idx * 40);
    const y = Number(pos.y ?? idx * 120);
    return {
      id: b.id,
      position: { x, y },
      data: { label, blockType: String(b.type) } satisfies FlowNodeData,
      type: "block",
    };
  });
}

function connectionsToEdges(conns: ConnectionRecord[]): Edge[] {
  return conns.map((c) => {
    const normalized = normalizeCondition(
      (c.condition as RouteCondition | Record<string, unknown>) ?? { kind: "default" }
    );
    return {
      id: c.id,
      source: c.from_block_id,
      target: c.to_block_id,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e" },
      style: { strokeWidth: 1.8 },
      data: { condition: normalized },
      label: summarize(normalized),
    };
  });
}

function summarize(cond?: RouteCondition) {
  if (!cond || cond.kind === "default") return "fallback";
  return `${cond.kind}:${String(cond.value ?? "")}`;
}

function edgesPayload(edgesLocal: Edge[]) {
  return edgesLocal.map((e) => ({
    from_block_id: e.source,
    to_block_id: e.target,
    condition: normalizeCondition(
      ((e.data as { condition?: RouteCondition })?.condition ?? {
        kind: "default",
      }) as RouteCondition
    ),
  }));
}

function Workbench(props: FlowProps) {
  const [funnelMeta, setFunnelMeta] = useState(props.funnel);
  const [blocks, setBlocks] = useState(props.initialBlocks);
  const [nodes, setNodes, onNodesChange] = useNodesState(blocksToNodes(props.initialBlocks));
  const [edges, setEdges, onEdgesChange] = useEdgesState(connectionsToEdges(props.initialConnections));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    props.initialBlocks[0]?.id ?? null
  );

  useEffect(() => {
    setNodes(blocksToNodes(blocks));
  }, [blocks, setNodes]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;
  const activeEdge = edges.find((e) => e.selected) ?? null;

  const questionBlocks = useMemo(
    () => blocks.filter((b) => String(b.type).startsWith("question")),
    [blocks]
  );

  async function reload() {
    try {
      const snap = await loadFunnelStructure(props.funnelId);
      setBlocks((snap.blocks as BlockRecord[]) ?? []);
      setFunnelMeta({
        ...(snap.funnel as (typeof funnelMeta)),
        settings: snap.funnel.settings as Record<string, unknown> | null,
      });
      setEdges(connectionsToEdges((snap.connections as ConnectionRecord[]) ?? []));
      toast.success("Sincronizado.", { duration: 600 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao recarregar");
    }
  }

  async function persistLayout(edgesSnapshot: Edge[], nodesSnapshot = nodes) {
    try {
      await upsertConnections(props.funnelId, edgesPayload(edgesSnapshot));
      await Promise.all(
        nodesSnapshot.map((node) =>
          updateBlock(node.id, {
            position: { x: node.position.x, y: node.position.y },
          })
        )
      );
      toast.success("Fluxo guardado.", { duration: 900 });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao guardar");
    }
  }

  async function persistEdges(edgesSnapshot: Edge[]) {
    try {
      await upsertConnections(props.funnelId, edgesPayload(edgesSnapshot));
      toast.success("Ligações actualizadas.", { duration: 700 });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao guardar ligações");
    }
  }

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((prev) =>
        addEdge(
          {
            ...connection,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e" },
            style: { strokeWidth: 1.8 },
            data: {
              condition: { kind: "default" } satisfies RouteCondition,
            },
            label: "fallback",
          },
          prev
        )
      );
    },
    [setEdges]
  );

  async function paletteAdd(type: BlockType) {
    try {
      await addBlock({
        funnelId: props.funnelId,
        type,
        position: {
          x: 140 + blocks.length * 42,
          y: 76 + blocks.length * 54,
        },
      });
      await reload();

      toast.success("Bloco adicionado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao adicionar bloco.");
    }
  }

  async function removeSelectedBlock() {
    if (!selectedBlockId) return;
    if (!confirm("Eliminar bloco seleccionado?")) return;
    try {
      await deleteBlock(selectedBlockId, props.funnelId);

      toast.success("Bloco eliminado.");
      setSelectedBlockId(null);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar bloco.");
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Painel
            </Link>
            <span>/</span>
            <span className="font-mono">/q/{funnelMeta.slug}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              className="max-w-md rounded-xl shadow-sm"
              value={funnelMeta.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFunnelMeta((p) => ({ ...p, name: e.target.value }))
              }
              onBlur={() =>
                void updateFunnelMeta(props.funnelId, { name: funnelMeta.name })
              }
            />
            <label className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
              <Switch
                checked={funnelMeta.published}
                onCheckedChange={(checked: boolean) => {
                  setFunnelMeta((p) => ({ ...p, published: checked }));
                  void updateFunnelMeta(props.funnelId, { published: checked });
                }}
              />
              {funnelMeta.published ? "público" : "rascunho"}
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/q/${funnelMeta.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" type="button" className="rounded-full">
              Pré-visualizar
            </Button>
          </Link>
          <Button
            size="lg"
            type="button"
            className="rounded-full"
            onClick={() => void persistLayout(edges, nodes)}
          >
            Guardar fluxo
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        <aside className="space-y-3 rounded-3xl border border-border/70 bg-card/80 p-4 shadow-lg shadow-black/5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Paleta
          </p>
          <div className="flex flex-col gap-2">
            {(
              [
                ["intro", "Intro"],
                ["question_mc", "Pergunta (MC)"],
                ["question_single", "Botão único"],
                ["question_text", "Texto"],
                ["question_image", "Imagem"],
                ["transition", "Transição"],
                ["outcome", "Resultado"],
                ["redirect", "Redireccionar"],
              ] as Array<[BlockType, string]>
            ).map(([id, label]) => (
              <Button
                key={id}
                type="button"
                variant="secondary"
                size="lg"
                className="rounded-2xl justify-start"
                onClick={() => void paletteAdd(id)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Separator />
          <Button
            type="button"
            variant="destructive"
            className="w-full rounded-2xl"
            disabled={!selectedBlockId}
            onClick={() => void removeSelectedBlock()}
          >
            Eliminar seleccionado
          </Button>
        </aside>

        <div className="h-[640px] rounded-3xl border border-border/70 shadow-inner shadow-black/5 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeDragStop={(_, node) => {
              void updateBlock(node.id as string, {
                position: { x: node.position.x, y: node.position.y },
              });
            }}
            onNodeClick={(_, node) => {
              setSelectedBlockId(node.id);
            }}
            onEdgeClick={(_, edge) =>
              setEdges((prev) =>
                prev.map((e) => ({ ...e, selected: e.id === edge.id }))
              )
            }
            onPaneClick={() =>
              setEdges((prev) => prev.map((e) => ({ ...e, selected: false })))
            }
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap pannable zoomable className="!rounded-2xl border border-border" />
            <Controls className="!rounded-2xl shadow-md" />
            <Background gap={26} />
            <Panel className="max-w-[220px] rounded-2xl border border-border bg-background/80 px-4 py-2 text-[11px] leading-snug text-muted-foreground backdrop-blur">
              Ligue dois blocos usando os nós inferior/superior. Depois personalize o ramo.
            </Panel>
          </ReactFlow>
        </div>

        <aside className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-4 shadow-lg shadow-black/5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Integrações
            </p>
            <WebhookForm funnelId={props.funnelId} settings={(funnelMeta.settings ?? {}) as FunnelSettings} />
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Ligações
            </p>
            {!activeEdge ? (
              <p className="text-xs text-muted-foreground">
                Selecciona um ramo no canvas para configurar igualdade/conteúdo.
              </p>
            ) : (
              <EdgeEditor
                key={activeEdge.id}
                edgeId={activeEdge.id}
                normalized={normalizeCondition(
                  (((activeEdge.data as { condition?: RouteCondition })?.condition ??
                    { kind: "default" }) as RouteCondition)
                )}
                blocks={blocks}
                onApply={(cond) => {
                  const mapped = edges.map((edge) =>
                    edge.id === activeEdge.id
                      ? {
                          ...edge,
                          data: {
                            ...(edge.data ?? {}),
                            condition: cond,
                          },
                          label: summarize(cond),
                        }
                      : edge
                  );
                  setEdges(mapped);
                  void persistEdges(mapped);
                }}
              />
            )}
          </div>
          <Separator />
          {!selectedBlock ? (
            <p className="text-xs text-muted-foreground">
              Clique um bloco no canvas ou na lista para editar conteúdo.
            </p>
          ) : (
            <BlockEditorPanel
              key={selectedBlock.id}
              record={selectedBlock}
              blocks={blocks}
              setBlocks={setBlocks}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function EdgeEditor(props: {
  edgeId: string;
  normalized: RouteCondition;
  blocks: BlockRecord[];
  onApply: (condition: RouteCondition) => void;
}) {
  const questionBlocks = useMemo(
    () => props.blocks.filter((b) => String(b.type).startsWith("question")),
    [props.blocks]
  );
  const [kind, setKind] = useState<RouteCondition["kind"]>(props.normalized.kind);
  const [blockId, setBlockId] = useState(props.normalized.blockId ?? questionBlocks[0]?.id ?? "");
  const [value, setValue] = useState(String(props.normalized.value ?? ""));

  useEffect(() => {
    setKind(props.normalized.kind);
    setBlockId(props.normalized.blockId ?? questionBlocks[0]?.id ?? "");
    setValue(String(props.normalized.value ?? ""));
  }, [props.normalized, props.edgeId, questionBlocks]);

  return (
    <div className="space-y-3 text-xs">
      <div className="space-y-1">
        <Label>Tipo</Label>
        <Select value={kind} onValueChange={(v) => setKind(v as RouteCondition["kind"])}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Igual</SelectItem>
            <SelectItem value="contains">Contém</SelectItem>
            <SelectItem value="default">Fallback</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {kind !== "default" ? (
        <>
          <div className="space-y-1">
            <Label>Pergunta</Label>
            <Select
              value={blockId}
              onValueChange={(value) => setBlockId(value ?? questionBlocks[0]?.id ?? "")}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionBlocks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {(b.content as { question?: string }).question ?? String(b.type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Valor / ID</Label>
            <Input
              className="rounded-xl font-mono text-[11px]"
              value={value}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
            />
          </div>
        </>
      ) : null}
      <Button
        type="button"
        size="sm"
        className="w-full rounded-full text-xs"
        onClick={() =>
          props.onApply(
            normalizeCondition({
              kind,
              blockId:
                kind === "default" ? undefined : blockId || questionBlocks[0]?.id || undefined,
              value: kind === "default" ? null : value,
            })
          )
        }
      >
        Actualizar ramo
      </Button>
    </div>
  );
}

function BlockEditorPanel(props: {
  record: BlockRecord;
  blocks: BlockRecord[];
  setBlocks: Dispatch<SetStateAction<BlockRecord[]>>;
}) {
  const { record, blocks, setBlocks } = props;
  const content = (record.content ?? {}) as Record<string, unknown>;

  const patch = useCallback((next: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === record.id ? { ...block, content: { ...content, ...next } } : block
      )
    );
  }, [record.id, content, setBlocks]);

  async function save() {
    const latest =
      blocks.find((b) => b.id === record.id) ??
      ({
        ...record,
        content: { ...(record.content ?? {}), ...(content ?? {}) },
      } as BlockRecord);
    await updateBlock(record.id, {
      content: (latest.content ?? {}) as Record<string, unknown>,
    });
    toast.success("Guardado.", { duration: 800 });
  }

  const typeStr = String(record.type);

  return (
    <div className="space-y-3 text-xs">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Bloco seleccionado
      </p>
      <Badge variant="outline" className="rounded-full text-[11px] uppercase tracking-wide">
        {typeStr}
      </Badge>

      {typeStr.startsWith("question") || typeStr === "intro" ? (
        <div className="space-y-1">
          <Label>{typeStr === "intro" ? "Título" : "Pergunta"}</Label>
          <Input
            className="rounded-xl"
            value={String(content.title ?? content.question ?? "")}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (typeStr === "intro") patch({ title: e.target.value });
              else patch({ question: e.target.value });
            }}
          />
        </div>
      ) : null}

      {typeStr === "intro" ? (
        <div className="space-y-1">
          <Label>Subtítulo</Label>
          <Input
            className="rounded-xl"
            value={String(content.subtitle ?? "")}
            onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ subtitle: e.target.value })}
          />
        </div>
      ) : null}

      {["intro", "transition", "question_single"].includes(typeStr) ? (
        <div className="space-y-1">
          <Label>CTA principal</Label>
          <Input
            className="rounded-xl"
            value={String(
              content.primaryCta ?? content.cta ?? content.optionLabel ?? ""
            )}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (typeStr === "intro") patch({ primaryCta: e.target.value });
              else if (typeStr === "transition") patch({ cta: e.target.value });
              else patch({ optionLabel: e.target.value });
            }}
          />
        </div>
      ) : null}

      {["question_mc", "question_image"].includes(typeStr) ? (
        <>
          <Label>Lista JSON das opções</Label>
          <Textarea
            className="min-h-[140px] rounded-xl font-mono text-[11px]"
            value={JSON.stringify(content.options ?? [], null, 2)}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              try {
                patch({ options: JSON.parse(e.target.value) });
              } catch {
                //
              }
            }}
          />
        </>
      ) : null}

      {typeStr === "question_text" ? (
        <>
          <Label>Placeholder</Label>
          <Input
            className="rounded-xl"
            value={String(content.placeholder ?? "")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              patch({ placeholder: e.target.value })
            }
          />
          <Label className="pt-3">captura campo lead</Label>
          <Select
            value={(content.captureAs as string | undefined) ?? "none"}
            onValueChange={(value) =>
              patch({ captureAs: !value || value === "none" ? undefined : value })
            }
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">não usar</SelectItem>
              <SelectItem value="lead_name">nome</SelectItem>
              <SelectItem value="lead_email">email</SelectItem>
              <SelectItem value="lead_phone">telefone</SelectItem>
            </SelectContent>
          </Select>
        </>
      ) : null}

      {typeStr === "transition" ? (
        <div className="space-y-1">
          <Label>Descrição rápida</Label>
          <Textarea
            className="min-h-[96px] rounded-xl text-[13px]"
            value={String(content.body ?? "")}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => patch({ body: e.target.value })}
          />
        </div>
      ) : null}

      {typeStr === "outcome" ? (
        <>
          <Label>Markdown resultado</Label>
          <Textarea
            className="min-h-[210px] rounded-xl text-[13px] leading-snug"
            value={String(content.bodyMarkdown ?? "")}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              patch({ bodyMarkdown: e.target.value })
            }
          />
          <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
            <Switch
              checked={Boolean(content.showLeadFormBefore)}
              onCheckedChange={(checked: boolean) => patch({ showLeadFormBefore: checked })}
            />
            pedir dados antes da mensagem
          </label>
        </>
      ) : null}

      {typeStr === "redirect" ? (
        <>
          <Label>URL final</Label>
          <Input
            className="rounded-xl font-mono text-[11px]"
            value={String(content.url ?? "")}
            onChange={(e: ChangeEvent<HTMLInputElement>) => patch({ url: e.target.value })}
          />
          <label className="flex items-center gap-2">
            <Switch
              checked={Boolean(content.openInNewTab)}
              onCheckedChange={(checked: boolean) => patch({ openInNewTab: checked })}
            />
            novo separador
          </label>
        </>
      ) : null}

      <Button type="button" className="w-full rounded-full" onClick={() => void save()}>
        Guardar conteúdo
      </Button>
    </div>
  );
}

function WebhookForm({ funnelId, settings }: { funnelId: string; settings: FunnelSettings }) {
  const [draft, setDraft] = useState({
    webhook: settings.webhook_url ?? "",
    phone: settings.whatsapp_phone ?? "",
    checkout: settings.checkout_base_url ?? "",
  });

  async function persistPatch(patch: Partial<FunnelSettings>) {
    const nextSettings = {
      ...(settings ?? {}),
      ...patch,
    };
    await updateFunnelMeta(funnelId, { settings: nextSettings });
  }

  return (
    <div className="space-y-2 text-xs">
      <div className="space-y-1">
        <Label>Webhook POST</Label>
        <Input
          className="rounded-xl font-mono text-[11px]"
          value={draft.webhook}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDraft((d) => ({ ...d, webhook: e.target.value }))
          }
          onBlur={(e: ChangeEvent<HTMLInputElement>) =>
            void persistPatch({ webhook_url: e.target.value })
          }
        />
      </div>
      <div className="space-y-1">
        <Label>WhatsApp número</Label>
        <Input
          className="rounded-xl font-mono text-[11px]"
          value={draft.phone}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDraft((d) => ({ ...d, phone: e.target.value }))
          }
          placeholder="5511999999999"
          onBlur={(e: ChangeEvent<HTMLInputElement>) =>
            void persistPatch({ whatsapp_phone: e.target.value })
          }
        />
      </div>
      <div className="space-y-1">
        <Label>Checkout base URL</Label>
        <Input
          className="rounded-xl font-mono text-[11px]"
          value={draft.checkout}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setDraft((d) => ({ ...d, checkout: e.target.value }))
          }
          onBlur={(e: ChangeEvent<HTMLInputElement>) =>
            void persistPatch({ checkout_base_url: e.target.value })
          }
        />
      </div>
    </div>
  );
}
