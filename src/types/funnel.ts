export type ConditionKind = "equals" | "contains" | "default";

export type RouteCondition = {
  kind: ConditionKind;
  /** question block id whose answer we're matching */
  blockId?: string;
  /** for equals: option id / text / image key */
  value?: string | null;
};

export type BlockType =
  | "intro"
  | "question_mc"
  | "question_single"
  | "question_text"
  | "question_image"
  | "transition"
  | "outcome"
  | "redirect";

export interface Funnel {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  published: boolean;
  settings: FunnelSettings;
  created_at: string;
  updated_at: string;
}

export interface FunnelSettings {
  webhook_url?: string;
  webhook_secret?: string;
  whatsapp_phone?: string;
  checkout_base_url?: string;
}

export interface BlockRecord {
  id: string;
  funnel_id: string;
  type: BlockType | string;
  content: Record<string, unknown>;
  sort_order: number;
  position: { x?: number; y?: number };
  created_at?: string;
  updated_at?: string;
}

export interface ConnectionRecord {
  id: string;
  funnel_id: string;
  from_block_id: string;
  to_block_id: string;
  condition: RouteCondition | Record<string, unknown>;
}

export interface LeadRecord {
  id: string;
  funnel_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  answers: Record<string, unknown>;
  session_id: string | null;
  created_at: string;
}

export interface AnalyticsRow {
  id: string;
  funnel_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  session_id: string | null;
  created_at: string;
}
