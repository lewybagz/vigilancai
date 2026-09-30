import { SEVERITY_LABEL } from "@/lib/severity";
import type { Change, Severity } from "@/lib/types";

const COLORS: Record<Severity, { color: string; tint: string }> = {
  critical: { color: "#D64545", tint: "#FBEBEB" },
  high: { color: "#C97A2E", tint: "#FBF2E7" },
  medium: { color: "#B89B2E", tint: "#FAF6E6" },
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', SFMono-Regular, Menlo, Consolas, monospace";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function cardHtml(c: Change): string {
  const v = COLORS[c.severity];
  const number =
    c.number_kind === "tag" || !c.number_display
      ? `<div style="font-family:${MONO};font-size:13px;font-weight:500;letter-spacing:.08em;color:${v.color};text-transform:uppercase">${esc(c.number_display ?? "Update")}</div>`
      : `<div style="font-size:22px;font-weight:700;letter-spacing:-.01em;color:${v.color};line-height:1">${esc(c.number_display)}</div>`;
  return `
  <div style="background:${v.tint};border:1px solid #E4E7EB;border-radius:12px;padding:24px;margin:0 0 16px">
    <div style="font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#12161C">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${v.color};margin-right:8px;vertical-align:middle"></span>${esc(c.source_name)}
      <span style="float:right;font-weight:400;text-transform:none;letter-spacing:0;color:#8A929B">${SEVERITY_LABEL[c.severity]}</span>
    </div>
    <div style="font-size:17px;font-weight:500;color:#12161C;line-height:1.35;margin:12px 0 16px">${esc(c.headline)}</div>
    ${number}
    ${c.effective_label ? `<div style="font-family:${MONO};font-size:12px;color:#8A929B;margin-top:6px">${esc(c.effective_label)}</div>` : ""}
    <div style="font-size:14px;font-weight:500;color:#3F4750;margin-top:16px">&rarr; ${esc(c.recommended_action)}</div>
    ${c.action_detail ? `<div style="font-size:14px;color:#3F4750;margin-top:8px;line-height:1.5">${esc(c.action_detail)}</div>` : ""}
  </div>`;
}

function shell(title: string, body: string, appUrl: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#F7F8F9;font-family:${FONT};color:#12161C">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    ${body}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E4E7EB;font-size:12px;color:#8A929B">
      Vigilancai checked this source and wrote this briefing. <a href="${appUrl}/app" style="color:#1F4B6B">Open the app</a> &middot; <a href="${appUrl}/app/settings" style="color:#1F4B6B">Alert settings</a>
    </div>
  </div>
</body></html>`;
}

export function criticalAlertEmail(input: { change: Change; ownerName: string; appUrl: string }) {
  const { change, ownerName, appUrl } = input;
  const subject = `Critical: ${change.headline}${change.number_display && change.number_kind !== "tag" ? ` (${change.number_display})` : ""}`;
  const body = `
    <div style="font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#D64545;margin-bottom:12px">Critical change</div>
    <div style="font-size:16px;color:#3F4750;margin-bottom:20px">${esc(ownerName)}, this needs attention today.</div>
    ${cardHtml(change)}
    ${change.source_excerpt ? `<div style="font-family:${MONO};font-size:12px;color:#3F4750;background:#fff;border:1px solid #E4E7EB;border-radius:8px;padding:12px;white-space:pre-wrap">${esc(change.source_excerpt.slice(0, 800))}</div>` : ""}
  `;
  const text = `CRITICAL CHANGE\n\n${change.source_name}: ${change.headline}\n${change.number_display ?? ""}\n${change.effective_label ?? ""}\n\n→ ${change.recommended_action}\n${change.action_detail ?? ""}\n\n${appUrl}/app`;
  return { subject, html: shell(subject, body, appUrl), text };
}

export function briefingEmail(input: {
  greeting: string;
  ownerName: string;
  changes: Change[];
  sourceNames: string[];
  cadence: "daily" | "weekly";
  appUrl: string;
}) {
  const { greeting, ownerName, changes, sourceNames, cadence, appUrl } = input;
  const n = changes.length;
  const period = cadence === "daily" ? "since yesterday" : "this week";
  const subject = n === 0 ? `Nothing changed ${period}` : `${n} important change${n === 1 ? "" : "s"} ${period}`;
  const checked = sourceNames.length
    ? `We checked ${sourceNames.slice(0, 4).join(", ")}${sourceNames.length > 4 ? `, and ${sourceNames.length - 4} others` : ""}.`
    : "";
  const body =
    n === 0
      ? `
    <div style="font-size:24px;font-weight:600;letter-spacing:-.01em">${esc(greeting)}, ${esc(ownerName)}.</div>
    <div style="font-size:17px;font-weight:500;margin-top:24px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2E7D5B;margin-right:10px;vertical-align:middle"></span>Nothing changed ${period}.</div>
    <div style="font-size:15px;color:#3F4750;margin-top:12px;line-height:1.5">${esc(checked)} Nothing needs your attention.</div>`
      : `
    <div style="font-size:24px;font-weight:600;letter-spacing:-.01em">${esc(greeting)}, ${esc(ownerName)}.</div>
    <div style="font-size:16px;color:#3F4750;margin:4px 0 28px">${n} important change${n === 1 ? "" : "s"} ${period}.</div>
    ${changes.map(cardHtml).join("")}
    <div style="font-size:15px;color:#8A929B;margin-top:32px;padding-top:24px;border-top:1px solid #E4E7EB">Everything else is unchanged.</div>`;
  const text =
    n === 0
      ? `${greeting}, ${ownerName}.\n\nNothing changed ${period}. ${checked} Nothing needs your attention.`
      : `${greeting}, ${ownerName}.\n${n} important changes ${period}.\n\n` +
        changes
          .map((c) => `[${SEVERITY_LABEL[c.severity]}] ${c.source_name}: ${c.headline}\n${c.number_display ?? ""} ${c.effective_label ?? ""}\n→ ${c.recommended_action}\n`)
          .join("\n") +
        `\nEverything else is unchanged.\n${appUrl}/app`;
  return { subject, html: shell(subject, body, appUrl), text };
}
