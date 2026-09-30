import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  name: string;
  href: string;
}

/** Guides › Pillar › Spoke. The last crumb is the current page and is not a link. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[13px] text-fog">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={item.href}>
              <li className={last ? "text-slate" : ""}>
                {last ? (
                  <span aria-current="page">{item.name}</span>
                ) : (
                  <Link href={item.href} className="hover:text-ink">
                    {item.name}
                  </Link>
                )}
              </li>
              {!last ? (
                <li aria-hidden="true" className="select-none">
                  &rsaquo;
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
