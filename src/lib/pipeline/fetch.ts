
import { createHash } from "node:crypto";

const UA = "Mozilla/5.0 (compatible; VigilancaiBot/1.0; +https://vigilancai.com/bot)";
const MAX_BYTES = 2_000_000;

export interface Fetched {
  text: string;
  hash: string;
  contentType: string;
}

/** Fetch a source page and reduce it to stable, comparable text. */
export async function fetchSource(url: string, cssSelector?: string | null, timeoutMs = 20000): Promise<Fetched> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,application/pdf;q=0.8,text/plain;q=0.7,*/*;q=0.5" },
      redirect: "follow",
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) throw new Error(`Page too large (${Math.round(buf.byteLength / 1024)} KB)`);

    let text: string;
    if (contentType.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
      text = extractPdfText(buf);
    } else if (contentType.includes("text/plain")) {
      text = buf.toString("utf8");
    } else {
      text = htmlToText(buf.toString("utf8"), cssSelector);
    }
    const normalized = normalize(text);
    return { text: normalized, hash: sha256(normalized), contentType };
  } finally {
    clearTimeout(t);
  }
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * Dependency-free HTML to text. Drops scripts, styles, nav/header/footer chrome,
 * then collapses whitespace but keeps line breaks at block boundaries so line diffs stay readable.
 */
export function htmlToText(html: string, cssSelector?: string | null): string {
  let h = html;
  // Optional scoping: support "#id" selectors by slicing the element with that id.
  if (cssSelector && /^#[\w-]+$/.test(cssSelector.trim())) {
    const id = cssSelector.trim().slice(1);
    const m = new RegExp(`<([a-z][a-z0-9]*)[^>]*\\bid=["']${id}["'][^>]*>`, "i").exec(h);
    if (m) {
      const start = m.index;
      const tag = m[1];
      const close = new RegExp(`</${tag}\\s*>`, "gi");
      close.lastIndex = start;
      let depth = 0;
      let end = -1;
      const open = new RegExp(`<${tag}\\b[^>]*>`, "gi");
      open.lastIndex = start;
      // Walk matching open/close tags to find the balanced end.
      const tokens: { i: number; open: boolean }[] = [];
      let om: RegExpExecArray | null;
      while ((om = open.exec(h))) tokens.push({ i: om.index, open: true });
      let cm: RegExpExecArray | null;
      while ((cm = close.exec(h))) tokens.push({ i: cm.index, open: false });
      tokens.sort((a, b) => a.i - b.i);
      for (const tk of tokens) {
        if (tk.i < start) continue;
        depth += tk.open ? 1 : -1;
        if (depth === 0) {
          end = tk.i;
          break;
        }
      }
      if (end > start) h = h.slice(start, end);
    }
  }

  h = h
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|iframe|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\s*(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|table|thead|tbody|blockquote|pre|dd|dt|ul|ol)\s*>/gi, "\n")
    .replace(/<\/(td|th)\s*>/gi, " \t ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(h);
}

function decodeEntities(s: string): string {
  const map: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…",
    rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", copy: "©", reg: "®", trade: "™", bull: "•",
  };
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => map[name.toLowerCase()] ?? m);
}

/** Best-effort text from a PDF's uncompressed text operators. Good enough for fee schedules; not a full parser. */
function extractPdfText(buf: Buffer): string {
  const raw = buf.toString("latin1");
  const parts: string[] = [];
  const re = /\((?:\\.|[^\\)])*\)\s*Tj|\[(?:[^\]]*)\]\s*TJ/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const chunk = m[0];
    const strings = chunk.match(/\((?:\\.|[^\\)])*\)/g) ?? [];
    parts.push(strings.map((s) => s.slice(1, -1).replace(/\\([()\\])/g, "$1")).join(""));
  }
  const text = parts.join(" ");
  return text.trim().length > 40 ? text : "[PDF text could not be extracted; page is compared by hash only]";
}

export function normalize(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t ]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter((l, i, arr) => l.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
