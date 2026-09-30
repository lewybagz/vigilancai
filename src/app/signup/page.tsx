import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = { title: "Get started" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Get started"
      blurb="Add your sources tonight. Your first briefing lands tomorrow morning."
      footer={
        <>
          Already have an account? <Link href="/login" className="text-accent underline underline-offset-2">Sign in</Link>
        </>
      }
    >
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
