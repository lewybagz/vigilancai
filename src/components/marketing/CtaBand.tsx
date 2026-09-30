import { ButtonLink } from "@/components/ui/Button";
import { Section } from "./Section";

export function CtaBand({
  title = "Stop finding out from customers.",
  body = "Set up your sources in ten minutes. The first briefing lands tomorrow morning.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <Section width="narrow" className="border-t border-hairline">
      <div className="text-center">
        <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink md:text-[36px]">{title}</h2>
        <p className="mx-auto mt-4 max-w-[480px] text-[16px] leading-relaxed text-slate md:text-[17px]">{body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/signup" size="lg">
            Get started
          </ButtonLink>
          <ButtonLink href="/pricing" variant="ghost" size="lg">
            See pricing
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
