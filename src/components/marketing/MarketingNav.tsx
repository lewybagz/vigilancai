"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { NAV_LINKS } from "./MarketingFooter";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 80));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close the mobile panel on navigation and on Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const condensed = scrolled || open;

  return (
    <header
      className={`sticky top-0 z-40 bg-paper/95 backdrop-blur transition-[height,border-color] ${
        condensed ? "border-b border-hairline" : "border-b border-transparent"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[1120px] items-center px-4 transition-[height] md:px-6 ${
          condensed ? "h-14" : "h-16 md:h-20"
        }`}
      >
        <Logo withDot />

        <nav aria-label="Primary" className="ml-10 hidden md:block">
          <ul className="flex items-center gap-7 text-[14px] font-medium">
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`transition-colors hover:text-ink ${active ? "text-ink" : "text-slate"}`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Get started
          </ButtonLink>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-surface md:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div id={panelId} className="border-t border-hairline bg-paper md:hidden">
          <nav aria-label="Primary mobile" className="mx-auto w-full max-w-[1120px] px-4 py-4">
            <ul className="space-y-1">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="block rounded-lg px-2 py-2.5 text-[16px] font-medium text-ink hover:bg-surface"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2 border-t border-hairline pt-4">
              <ButtonLink href="/login" variant="secondary" className="w-full">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" className="w-full">
                Get started
              </ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
