import type {
  BlockRecord,
  ConnectionRecord,
  RouteCondition,
} from "@/types/funnel";

export function normalizeCondition(
  raw: RouteCondition | Record<string, unknown>
): RouteCondition {
  const r = raw as RouteCondition;
  const kind = r.kind ?? "default";
  if (kind === "equals") {
    return {
      kind: "equals",
      blockId: r.blockId,
      value: r.value !== undefined ? String(r.value) : "",
    };
  }
  if (kind === "contains") {
    return {
      kind: "contains",
      blockId: r.blockId,
      value: r.value !== undefined ? String(r.value) : "",
    };
  }
  return { kind: "default" };
}

function getAnswerForBlock(
  answers: Record<string, string>,
  blockId: string | undefined
): string {
  if (!blockId) return "";
  return answers[blockId] ?? "";
}

export function edgeMatchesAnswer(
  cond: RouteCondition,
  answers: Record<string, string>
): boolean {
  if (cond.kind === "default") return false;
  const needle = cond.value ?? "";
  const haystack = getAnswerForBlock(answers, cond.blockId);

  if (cond.kind === "equals") {
    return haystack === needle;
  }
  if (cond.kind === "contains") {
    return haystack.toLowerCase().includes(needle.toLowerCase());
  }
  return false;
}

export function getEntryBlock(blocks: BlockRecord[]): BlockRecord | null {
  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order);
  const intro = sorted.find((b) => b.type === "intro");
  return intro ?? sorted[0] ?? null;
}

export function resolveNextBlockId(
  fromBlockId: string,
  connections: ConnectionRecord[],
  answers: Record<string, string>
): string | null {
  const outbound = connections.filter((c) => c.from_block_id === fromBlockId);

  const withNorm = outbound.map((c) => ({
    ...c,
    condition: normalizeCondition(
      c.condition as RouteCondition | Record<string, unknown>
    ),
  }));

  const nonDefault = withNorm.filter((c) => c.condition.kind !== "default");
  const defaults = withNorm.filter((c) => c.condition.kind === "default");

  for (const c of nonDefault.sort((a, b) =>
    `${a.condition.kind}:${a.condition.value}`.localeCompare(
      `${b.condition.kind}:${b.condition.value}`
    )
  )) {
    if (edgeMatchesAnswer(c.condition, answers)) return c.to_block_id;
  }

  if (defaults.length > 0) return defaults[0].to_block_id;

  return outbound[0]?.to_block_id ?? null;
}

const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/g;

export function interpolateTemplate(
  template: string,
  ctx: Record<string, string | number | undefined | null>
): string {
  return template.replace(
    placeholderRegex,
    (_, key: string) => String(ctx[key] ?? "")
  );
}

export function collectScoreFromAnswers(answers: Record<string, unknown>): number {
  const v = answers.__score;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const s = answers.score;
  if (typeof s === "number") return s;
  if (typeof s === "string") {
    const n = Number(s);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}
