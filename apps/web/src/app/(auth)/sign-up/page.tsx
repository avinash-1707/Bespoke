"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@/lib/hooks/use-auth";

// Functional only — no styling yet. Wires the sign-up form to Better Auth.
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
      { onSuccess: () => router.push("/") },
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
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
        minLength={8}
      />
      <button type="submit" disabled={signUp.isPending}>
        {signUp.isPending ? "Creating account…" : "Sign up"}
      </button>
      {signUp.isError ? <p role="alert">{signUp.error.message}</p> : null}
    </form>
  );
}
