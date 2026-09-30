import type { ReactNode } from "react";
import { AppNav } from "@/components/app/AppNav";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = { title: "Briefing" };

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppNav />
      <main className="mx-auto w-full max-w-[640px] px-4 pb-24 pt-8 md:pl-[calc(3.5rem+1rem)] md:pr-6 md:pt-12 lg:pl-[calc(3.5rem+2rem)]">
        {children}
      </main>
    </ToastProvider>
  );
}
