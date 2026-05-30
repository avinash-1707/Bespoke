"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@/lib/hooks/use-auth";
import { Reveal } from "@/components/landing/reveal";
import { AuthField } from "@/components/auth/auth-field";
import { SubmitButton } from "@/components/auth/submit-button";

export default function SignUpPage() {
  const router = useRouter();
  const signUp = useSignUp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signUp.mutate(
      { name, email, password },
      { onSuccess: () => router.push("/dashboard") },
    );
  }

  return (
    <div className="rounded-2xl border border-(--lp-line) bg-(--lp-bg-raised) p-7 shadow-[0_18px_44px_-28px_rgba(33,28,23,0.35)] sm:p-8">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-(--lp-accent)">
          Get started
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-(--lp-text)">
          Create your account
        </h1>
      </Reveal>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <Reveal delay={80}>
          <AuthField
            label="Name"
            type="text"
            autoComplete="name"
            placeholder="Jane Maker"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Reveal>

        <Reveal delay={140}>
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

        <Reveal delay={200}>
          <AuthField
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </Reveal>

        {signUp.isError ? (
          <Reveal>
            <p
              role="alert"
              className="rounded-md border border-(--lp-danger)/30 bg-(--lp-danger-tint) px-3.5 py-2.5 text-sm text-(--lp-danger)"
            >
              {signUp.error.message}
            </p>
          </Reveal>
        ) : null}

        <Reveal delay={260}>
          <SubmitButton
            pending={signUp.isPending}
            pendingLabel="Creating account…"
          >
            Create account
          </SubmitButton>
        </Reveal>
      </form>

      <Reveal delay={320}>
        <p className="mt-7 text-center text-sm text-(--lp-text-soft)">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-(--lp-accent) underline-offset-4 transition-colors duration-150 hover:text-(--lp-accent-deep) hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
