import type { ComponentProps, ReactNode } from "react";

type Width = "narrow" | "default" | "wide";

const widths: Record<Width, string> = {
  narrow: "max-w-[680px]",
  default: "max-w-[960px]",
  wide: "max-w-[1120px]",
};

/**
 * Marketing section: consistent horizontal gutters (16px on mobile) and
 * generous vertical rhythm. Renders a <section> by default.
 */
export function Section({
  children,
  width = "default",
  className = "",
  tight = false,
  ...props
}: ComponentProps<"section"> & { children: ReactNode; width?: Width; tight?: boolean }) {
  return (
    <section className={`${tight ? "py-12 md:py-16" : "py-20 md:py-28"} ${className}`} {...props}>
      <div className={`mx-auto w-full ${widths[width]} px-4 md:px-6`}>{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-fog">{children}</div>
  );
}

export function Heading({
  children,
  as: Tag = "h2",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "text-[24px] md:text-[28px]",
    md: "text-[32px] md:text-[40px]",
    lg: "text-[36px] md:text-[48px] lg:text-[56px]",
  };
  return (
    <Tag className={`font-semibold leading-[1.1] tracking-[-0.02em] text-ink ${sizes[size]} ${className}`}>
      {children}
    </Tag>
  );
}

export function Lede({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[18px] leading-relaxed text-slate md:text-[20px] ${className}`}>{children}</p>;
}
