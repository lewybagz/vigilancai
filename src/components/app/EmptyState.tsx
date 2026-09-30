import { CalmDot } from "@/components/ui/SeverityDot";

function listNames(names: string[]): string {
  if (names.length === 0) return "your sources";
  if (names.length <= 4) {
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  }
  const rest = names.length - 4;
  return `${names.slice(0, 4).join(", ")}, and ${rest} other${rest === 1 ? "" : "s"}`;
}

export function NothingChanged({ sourceNames }: { sourceNames: string[] }) {
  return (
    <div className="mt-10">
      <p className="flex items-center gap-2.5 text-[17px] font-medium text-ink">
        <CalmDot />
        Nothing changed today.
      </p>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate">
        We checked {listNames(sourceNames)} overnight. Nothing needs your attention.
      </p>
    </div>
  );
}

export function FirstRun({ hasSources }: { hasSources: boolean }) {
  return (
    <div className="mt-10">
      <p className="flex items-center gap-2.5 text-[17px] font-medium text-ink">
        <CalmDot />
        {hasSources ? "We're watching your sources now." : "Add the sources you want watched."}
      </p>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate">
        {hasSources
          ? "Your first briefing will be ready tomorrow morning."
          : "Start with your city or county permit page, your main supplier, and your licensing board. Your first briefing will be ready the morning after."}
      </p>
    </div>
  );
}
