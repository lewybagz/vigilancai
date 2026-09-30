import { LogoMark } from "@/components/ui/Logo";
import { DemoCardList } from "./DemoCard";

/**
 * Phone-width mockup of the daily "Good morning" briefing.
 * Static, no chrome beyond a hairline frame; it is a product view, not an illustration.
 */
export function BriefingMockup() {
  return (
    <div
      className="mx-auto w-full max-w-[400px] rounded-[20px] border border-hairline bg-paper p-3 shadow-[0_1px_2px_rgba(18,22,28,0.04),0_12px_32px_-12px_rgba(18,22,28,0.12)]"
      role="img"
      aria-label="Example morning briefing: three important changes since yesterday, ranked by severity, then a note that everything else is unchanged."
    >
      <div className="rounded-[14px] bg-paper px-3 pb-6 pt-4">
        <div className="flex items-center justify-between px-1">
          <LogoMark size={18} />
          <span className="font-mono text-[11px] text-fog">Tue, Sep 30</span>
        </div>

        <div className="mt-6 px-1">
          <div className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Good morning, Lewis.</div>
          <div className="mt-1 text-[14px] text-slate">3 important changes since yesterday.</div>
        </div>

        <div className="mt-5">
          <DemoCardList compact />
        </div>

        <p className="mt-6 px-1 text-center text-[13px] text-fog">Everything else is unchanged.</p>
      </div>
    </div>
  );
}
