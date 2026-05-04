"use client";

import dynamic from "next/dynamic";
import type { BlockRecord, ConnectionRecord } from "@/types/funnel";

const FunnelBuilder = dynamic(() => import("@/components/builder/funnel-builder"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
      A carregar construtor visual…
    </div>
  ),
});

export function FunnelEditorShell(props: {
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
}) {
  return (
    <FunnelBuilder
      funnelId={props.funnelId}
      funnel={props.funnel}
      initialBlocks={props.initialBlocks}
      initialConnections={props.initialConnections}
    />
  );
}
