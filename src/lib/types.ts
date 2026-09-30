export type Severity = "medium" | "high" | "critical";
export type ChangeStatus = "published" | "needs_review" | "handled" | "dismissed";
export type ChangeCategory =
  | "permit_fee"
  | "material_price"
  | "licensing"
  | "code_requirement"
  | "supplier_terms"
  | "other";
export type NumberKind = "dollar" | "percent" | "date" | "tag";
export type SourceKind = "jurisdiction" | "supplier" | "manufacturer" | "licensing" | "code";
export type SourceCadence = "hourly" | "daily" | "weekly";
export type SourceStatus = "pending" | "ok" | "error";
export type Trade = "roofing" | "hvac" | "gc";
export type BriefingCadence = "daily" | "weekly";
export type SeverityThreshold = "critical" | "critical_high" | "all";
export type PlanTier = "starter" | "pro";
export type GuideStatus = "draft" | "published" | "archived";

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  business_name: string | null;
  trade: Trade;
  service_area: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  cadence: BriefingCadence;
  delivery_time: string;
  timezone: string;
  delivery_channel: string;
  threshold: SeverityThreshold;
  in_app_history_sync: boolean;
  last_briefing_sent_at: string | null;
  updated_at: string;
}

export interface AlertRecipient {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Source {
  id: string;
  user_id: string;
  name: string;
  kind: SourceKind;
  url: string;
  cadence: SourceCadence;
  css_selector: string | null;
  snoozed_until: string | null;
  status: SourceStatus;
  last_error: string | null;
  last_checked_at: string | null;
  last_changed_at: string | null;
  created_at: string;
}

export interface TradeRelevance {
  roofing?: number;
  hvac?: number;
  gc?: number;
}

/** How the change was classified and whether the two classifiers agreed. */
export interface ClassificationMeta {
  method: "laya_llm" | "llm_only";
  agreed?: boolean;
  laya_confidence?: number;
  laya_severity?: Severity;
  llm_severity?: Severity;
  laya_category?: ChangeCategory;
  llm_category?: ChangeCategory;
  reasons?: string[];
  attribution?: { label: string; support: number }[];
}

export interface Change {
  id: string;
  user_id: string;
  source_id: string | null;
  source_name: string;
  headline: string;
  summary: string;
  category: ChangeCategory;
  severity: Severity;
  number_display: string | null;
  number_kind: NumberKind;
  effective_label: string | null;
  effective_date: string | null;
  recommended_action: string;
  action_detail: string | null;
  source_excerpt: string | null;
  diff_before: string | null;
  diff_after: string | null;
  status: ChangeStatus;
  trade_relevance: TradeRelevance;
  classification: ClassificationMeta;
  laya_result: unknown;
  llm_result: unknown;
  alert_sent_at: string | null;
  detected_at: string;
  handled_at: string | null;
  created_at: string;
}

export interface Subscription {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: PlanTier | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  title: string;
  description: string;
}

export interface GuidePillar {
  id: string;
  slug: string;
  title: string;
  primary_keyword: string;
  meta_description: string;
  body_markdown: string;
  hero_image_url: string | null;
  published_at: string | null;
  updated_at: string;
  related_pillar_ids: string[];
  faq: FaqItem[];
  status: GuideStatus;
}

export interface GuideSpoke {
  id: string;
  pillar_id: string;
  slug: string;
  title: string;
  primary_keyword: string;
  meta_description: string;
  body_markdown: string;
  is_how_to: boolean;
  how_to_steps: HowToStep[] | null;
  published_at: string | null;
  updated_at: string;
  faq: FaqItem[];
  status: GuideStatus;
}

export interface GuideRedirect {
  id: string;
  old_path: string;
  new_path: string;
  changed_at: string;
}
