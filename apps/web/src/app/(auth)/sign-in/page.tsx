"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@/lib/hooks/use-auth";

// Functional only — no styling yet. Wires the sign-in form to Better Auth.
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
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={signIn.isPending}>
        {signIn.isPending ? "Signing in…" : "Sign in"}
      </button>
      {signIn.isError ? <p role="alert">{signIn.error.message}</p> : null}
    </form>
  );
}
