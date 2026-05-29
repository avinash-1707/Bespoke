import { createAuthClient } from "better-auth/react";

/**
 * Better Auth browser client. Points at the separate Fastify API; the client
 * appends `/api/auth` to this base. Session access goes through this client —
 * component code never parses cookies directly.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
