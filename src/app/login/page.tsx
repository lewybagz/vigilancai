import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      blurb="Your briefing is waiting."
      footer={
        <>
          New here? <Link href="/signup" className="text-accent underline underline-offset-2">Create an account</Link>
        </>
      }
    >
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
