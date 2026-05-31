"use client";

import { useMutation } from "@tanstack/react-query";
import { authClient } from "../auth-client";

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

/**
 * Better Auth client methods return `{ data, error }` rather than throwing.
 * Unwrap here so TanStack Query's error/success paths work as expected.
 */
function unwrap<T>(result: { data: T | null; error: { message?: string } | null }): T {
  if (result.error) {
    throw new Error(result.error.message ?? "Request failed");
  }
  return result.data as T;
}

export function useSignUp() {
  return useMutation({
    mutationFn: async (input: SignUpInput) =>
      unwrap(await authClient.signUp.email(input)),
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: async (input: SignInInput) =>
      unwrap(await authClient.signIn.email(input)),
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => unwrap(await authClient.signOut()),
  });
}
