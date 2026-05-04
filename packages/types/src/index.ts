/** Tipos compartilhados entre web e API */

export type Plan = "free" | "pro" | "premium";

export type QuizStatus = "draft" | "published";

export type StepType = "question" | "input" | "content" | "result";

export type DomainStatus = "pending" | "active";

export type EventType =
  | "page_view"
  | "quiz_start"
  | "step_view"
  | "answer_selected"
  | "lead_submitted"
  | "quiz_completed"
  | "cta_clicked";

export interface QuizPixelSettings {
  facebookPixelId?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  tiktokPixelId?: string;
}

export interface QuizTheme {
  primary?: string;
  background?: string;
  logoUrl?: string;
}
