"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/ui/Logo";

const ITEMS = [
  { href: "/app", label: "Home", icon: HomeIcon },
  { href: "/app/history", label: "History", icon: HistoryIcon },
  { href: "/app/sources", label: "Sources", icon: SourcesIcon },
  { href: "/app/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  return (
    <>
      {/* Desktop: slim left rail, icon-only until hovered */}
      <nav
        aria-label="Primary"
        className="group fixed inset-y-0 left-0 z-30 hidden w-14 flex-col border-r border-hairline bg-paper transition-[width] duration-150 hover:w-44 md:flex"
      >
        <div className="flex h-14 items-center px-4">
          <Link href="/app" aria-label="Vigilancai home">
            <LogoMark size={22} />
          </Link>
        </div>
        <ul className="mt-2 flex flex-col gap-1 px-2">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-10 items-center gap-3 overflow-hidden rounded-lg px-2.5 text-[14px] font-medium transition-colors ${
                    active ? "bg-surface text-ink" : "text-fog hover:bg-surface hover:text-ink"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-paper/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-4">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                    active ? "text-ink" : "text-fog"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

type IconProps = { className?: string };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function HistoryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2" />
    </svg>
  );
}
function SourcesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16" />
    </svg>
  );
}
function SettingsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}
