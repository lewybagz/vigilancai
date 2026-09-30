import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function AuthShell({ title, blurb, children, footer }: { title: string; blurb: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1 text-[15px] text-slate">{blurb}</p>
      <div className="mt-8">{children}</div>
      <p className="mt-8 text-[14px] text-slate">{footer}</p>
      <p className="mt-10 text-[13px] text-fog">
        <Link href="/" className="hover:text-ink">← Back to vigilancai.com</Link>
      </p>
    </div>
  );
}
