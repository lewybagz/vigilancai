"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setNotice("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setNotice("Magic link sent. Check your email.");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <Label htmlFor="first">First name</Label>
          <Input id="first" className="mt-1" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required />
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          className="mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={8}
          required
        />
      </div>
      {error && <p className="text-[14px] text-critical">{error}</p>}
      {notice && <p className="text-[14px] text-calm">{notice}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
      {mode === "login" && (
        <button type="button" onClick={magicLink} disabled={busy} className="block w-full text-center text-[14px] text-slate hover:text-ink">
          Email me a sign-in link instead
        </button>
      )}
    </form>
  );
}
