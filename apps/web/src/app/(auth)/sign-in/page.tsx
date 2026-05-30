"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@/lib/hooks/use-auth";
import { Reveal } from "@/components/landing/reveal";
import { AuthField } from "@/components/auth/auth-field";
import { SubmitButton } from "@/components/auth/submit-button";

export default function SignInPage() {
  const router = useRouter();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signIn.mutate({ email, password }, { onSuccess: () => router.push("/") });
  }

  return (
    <div className="rounded-2xl border border-(--lp-line) bg-(--lp-bg-raised) p-7 shadow-[0_18px_44px_-28px_rgba(33,28,23,0.35)] sm:p-8">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-(--lp-accent)">
          Welcome back
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-(--lp-text)">
          Sign in to Bespoke
        </h1>
      </Reveal>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <Reveal delay={80}>
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Reveal>

        <Reveal delay={140}>
          <AuthField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Reveal>

        {signIn.isError ? (
          <Reveal>
            <p
              role="alert"
              className="rounded-md border border-(--lp-danger)/30 bg-(--lp-danger-tint) px-3.5 py-2.5 text-sm text-(--lp-danger)"
            >
              {signIn.error.message}
            </p>
          </Reveal>
        ) : null}

        <Reveal delay={200}>
          <SubmitButton pending={signIn.isPending} pendingLabel="Signing in…">
            Sign in
          </SubmitButton>
        </Reveal>
      </form>

      <Reveal delay={260}>
        <p className="mt-7 text-center text-sm text-(--lp-text-soft)">
          New to Bespoke?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-(--lp-accent) underline-offset-4 transition-colors duration-150 hover:text-(--lp-accent-deep) hover:underline"
          >
            Create an account
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
