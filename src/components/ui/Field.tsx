import type { ComponentProps, ReactNode } from "react";

const control =
  "h-10 w-full rounded-lg border border-hairline bg-surface px-3 text-[15px] text-ink placeholder:text-fog focus:border-accent";

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-[14px] font-medium text-ink">{children}</span>
      {hint && <span className="mt-0.5 block text-[13px] text-fog">{hint}</span>}
    </label>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${control} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${control} appearance-none ${className}`} {...props} />;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  name,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange?: (v: T) => void;
  name?: string;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-lg border border-hairline bg-surface p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <label
            key={o.value}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active ? "bg-ink text-white" : "text-slate hover:text-ink"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={active}
              onChange={() => onChange?.(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}
