
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Trade } from "@/lib/types";
import { TRADE_LABEL } from "@/lib/severity";

/**
 * Claude does two jobs on a material diff: an independent classification (so Laya has
 * something to agree or disagree with) and the writing: headline, number, action.
 */

export const MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5-5";

const ExtractedChange = z.object({
  material: z.boolean().describe("True if this affects what a contractor pays, must do, or by when."),
  category: z.enum(["permit_fee", "material_price", "licensing", "code_requirement", "supplier_terms", "other"]),
  severity: z.enum(["medium", "high", "critical"]),
  severity_reason: z.string().describe("One sentence on why this severity, in plain English."),
  trade_relevance: z.object({
    roofing: z.number().min(0).max(1),
    hvac: z.number().min(0).max(1),
    gc: z.number().min(0).max(1),
  }),
  headline: z.string().describe("The change in one plain sentence, max 90 characters. No source name, no severity word."),
  summary: z.string().describe("One or two sentences of detail. Never a paragraph."),
  number_display: z
    .string()
    .nullable()
    .describe('The single most important number, formatted for display: "+$55", "+8.2%", "Oct 30". Null if none.'),
  number_kind: z.enum(["dollar", "percent", "date", "tag"]),
  tag: z.string().nullable().describe('When there is no number, a 1-3 word mono tag like "NEW BULLETIN" or "RULE CHANGE". Null otherwise.'),
  effective_label: z.string().nullable().describe('Short mono line like "Effective Aug 1" or "Comment period ends Oct 30". Null if unknown.'),
  effective_date: z.string().nullable().describe("ISO date YYYY-MM-DD if a specific effective date is stated, else null."),
  recommended_action: z.string().describe("An imperative action for the owner, max 60 characters. Decide, don't observe."),
  action_detail: z.string().describe("Two or three sentences on exactly what to do, specific to the owner's trade."),
  before_excerpt: z.string().describe("The exact old text this change is based on, max 400 characters. Empty string if new."),
  after_excerpt: z.string().describe("The exact new text this change is based on, max 400 characters."),
});

const Extraction = z.object({
  changes: z
    .array(ExtractedChange)
    .max(4)
    .describe("Distinct material changes found in the diff. Empty if the diff is only boilerplate."),
  noise_reason: z.string().nullable().describe("If changes is empty, one sentence on why this diff is not material."),
});

export type LlmChange = z.infer<typeof ExtractedChange>;
export type LlmExtraction = z.infer<typeof Extraction>;

const SYSTEM = `You are the classifier and writer behind Vigilancai, a briefing product for roofing, HVAC, and general contracting business owners. Each morning an owner reads a short list of what changed at the jurisdictions, suppliers, manufacturers, and licensing boards they depend on.

Your job on each diff of a watched web page:
1. Decide whether anything material changed. Material means it changes what the owner pays, must do, or by when: fee amounts, prices, surcharges, rules, deadlines, license or code requirements. Layout, navigation, dates in footers, counters, and reworded boilerplate are not material.
2. For each distinct material change, classify it and write the card.

Voice rules. Plain-spoken, confident, slightly technical, never cute. No exclamation points, no emoji, no hedging. Headlines state the change, not the source. Numbers are the emotional core: pick the single most useful number and format it for display. Recommended actions are decisions ("Update pending estimates"), never observations ("Fee has changed"). Tailor action_detail to the owner's trade.

Severity rubric. critical: act now, affects money already quoted, jobs in progress, or legal compliance. high: act soon, affects open bids or jobs starting within a month. medium: worth knowing, no action this week.

Be conservative with critical. A price or fee increase that applies to work already quoted is critical. A future increase with more than 30 days notice is usually high. Informational bulletins are medium unless they carry a compliance deadline within 60 days.`;

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export async function extractChanges(input: {
  sourceName: string;
  sourceKind: string;
  sourceUrl: string;
  hunks: string;
  ownerTrade: Trade;
  ownerBusiness?: string | null;
  serviceArea?: string | null;
}): Promise<LlmExtraction> {
  const user = `Owner context: ${TRADE_LABEL[input.ownerTrade]} contractor${input.ownerBusiness ? ` (${input.ownerBusiness})` : ""}${
    input.serviceArea ? `, service area ${input.serviceArea}` : ""
  }.
Source: ${input.sourceName} (${input.sourceKind}) at ${input.sourceUrl}

Diff of the page (lines starting with "-" were removed, "+" were added, others are context):

${input.hunks}`;

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { effort: "medium", format: zodOutputFormat(Extraction) },
    messages: [{ role: "user", content: user }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Claude declined to classify (${response.stop_details?.category ?? "unspecified"})`);
  }
  if (!response.parsed_output) throw new Error("Claude returned no parsable output");
  return response.parsed_output;
}
