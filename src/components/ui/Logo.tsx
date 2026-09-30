import Link from "next/link";

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block rounded-[6px]"
        style={{
          width: size,
          height: size,
          background: "var(--ink)",
          position: "relative",
        }}
      >
        <span
          className="absolute rounded-full"
          style={{ width: size * 0.32, height: size * 0.32, right: size * 0.18, top: size * 0.18, background: "var(--critical)" }}
        />
      </span>
    </span>
  );
}

export function Logo({ href = "/", withDot = false }: { href?: string; withDot?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-ink">
      <LogoMark />
      <span className="text-[17px]">Vigilancai</span>
      {withDot && <span className="ml-0.5 inline-block h-2 w-2 rounded-full" style={{ background: "var(--critical)" }} aria-hidden />}
    </Link>
  );
}
