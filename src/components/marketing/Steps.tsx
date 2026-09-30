import type { ReactNode } from "react";

export interface Step {
  number: string;
  title: string;
  summary: string;
  detail?: ReactNode;
}

export const STEPS: Step[] = [
  {
    number: "01",
    title: "We watch",
    summary:
      "Manufacturer price sheets, distributor catalogs, county and city permit pages, and licensing boards. Checked on a schedule you set, overnight by default.",
    detail: (
      <>
        <p>
          You tell us which sources matter to your crew: the supplier you actually buy from, the jurisdictions you pull
          permits in, the board that holds your license. We fetch each page on its own cadence and keep the last known
          version, so a change is a real diff against what was there yesterday, not a guess.
        </p>
        <p>
          Nothing is scraped from places you didn&rsquo;t ask about. If a page moves or goes down, you see that too,
          quietly, in the source list.
        </p>
      </>
    ),
  },
  {
    number: "02",
    title: "We classify",
    summary:
      "Every change is ranked critical, high, or medium and rewritten in plain English with a recommended action. Noise is dropped, not delivered.",
    detail: (
      <>
        <p>
          A fast decision model reads each diff first and decides whether it matters to your trade and how much. Claude
          then reads the same change independently and writes the one-line summary, the number, the effective date, and
          what to do about it.
        </p>
        <p>
          When the two disagree on severity, the change is held for review instead of sent. You get to see why it was
          flagged: the signals that tipped it, and which classifier said what.
        </p>
      </>
    ),
  },
  {
    number: "03",
    title: "You get one briefing",
    summary:
      "A daily or weekly Good Morning digest, ranked by severity. Critical changes go out immediately to you and your crew.",
    detail: (
      <>
        <p>
          One email, one page. The most important change is at the top; the rest follow in order. When nothing changed,
          the briefing says so in one line and you get on with your day.
        </p>
        <p>
          Critical changes don&rsquo;t wait for the morning. A permit fee that takes effect this week goes to you and the
          crew emails you listed the moment it clears classification.
        </p>
      </>
    ),
  },
];

export function Steps({ expanded = false }: { expanded?: boolean }) {
  return (
    <ol className={expanded ? "space-y-14 md:space-y-20" : "grid gap-10 md:grid-cols-3 md:gap-8"}>
      {STEPS.map((s) => (
        <li key={s.number} className={expanded ? "grid gap-4 md:grid-cols-[120px_1fr] md:gap-10" : ""}>
          <div className="font-mono text-[12px] text-fog">{s.number}</div>
          <div>
            <h3 className={`font-semibold tracking-[-0.01em] text-ink ${expanded ? "text-[26px] md:text-[30px]" : "mt-3 text-[22px]"}`}>
              {s.title}
            </h3>
            <p className={`mt-3 leading-relaxed text-slate ${expanded ? "text-[17px] md:text-[18px]" : "text-[15px]"}`}>
              {s.summary}
            </p>
            {expanded && s.detail && (
              <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-slate">{s.detail}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
