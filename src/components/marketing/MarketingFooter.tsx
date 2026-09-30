import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { SITE } from "@/lib/site";

export const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/guides", label: "Guides" },
  { href: "/about", label: "About" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-hairline bg-paper">
      <div className="mx-auto w-full max-w-[1120px] px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo withDot />
            <p className="mt-3 max-w-[320px] text-[14px] leading-relaxed text-slate">
              Permit fees, material prices, and licensing rules, checked overnight and ranked by severity.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-8 sm:flex-row sm:gap-16">
            <ul className="space-y-2.5 text-[14px]">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-2.5 text-[14px]">
              <li>
                <a href={`mailto:${SITE.contactEmail}`} className="text-slate hover:text-ink">
                  {SITE.contactEmail}
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-slate hover:text-ink">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate hover:text-ink">
                  Terms
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-hairline pt-6 font-mono text-[12px] text-fog sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} {SITE.name}</span>
          <span>{SITE.founder.city}, Arizona</span>
        </div>
      </div>
    </footer>
  );
}
