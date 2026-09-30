import type { FaqItem } from "@/lib/types";

export function FaqBlock({ faq }: { faq: FaqItem[] | null | undefined }) {
  const items = (faq ?? []).filter((f) => f?.question?.trim() && f?.answer?.trim());
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="faq-heading" className="mt-12 border-t border-hairline pt-8">
      <h2 id="faq-heading" className="text-[24px] font-semibold tracking-tight text-ink">
        Frequently asked
      </h2>
      <div className="mt-4 divide-y divide-hairline border-b border-hairline">
        {items.map((f) => (
          <details key={f.question} className="group py-4">
            <summary className="cursor-pointer list-none text-[17px] font-medium text-ink marker:content-none">
              <span className="flex items-start justify-between gap-4">
                <span>{f.question}</span>
                <span aria-hidden="true" className="font-mono text-[14px] text-fog group-open:hidden">
                  +
                </span>
                <span aria-hidden="true" className="hidden font-mono text-[14px] text-fog group-open:inline">
                  &minus;
                </span>
              </span>
            </summary>
            <p className="mt-3 text-[16px] leading-[1.7] text-slate">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
