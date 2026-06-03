import fp from "fastify-plugin";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../lib/auth";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

declare module "fastify" {
  interface FastifyRequest {
    /** Authenticated user id, populated by `requireAuth`. */
    userId: string;
    /** Full Better Auth session, populated by `requireAuth`. */
    session: NonNullable<Session>;
  }
}

/**
 * Mounts the Better Auth catch-all handler at `/api/auth/*`. Every auth
 * endpoint (sign-up, sign-in, sign-out, session) is served by Better Auth;
 * we only bridge Fastify's request/reply to the web-standard Request/Response
 * Better Auth expects.
 */
export const authPlugin = fp(async (fastify) => {
  // Reserve the request properties; real values are set by `requireAuth`.
  fastify.decorateRequest("userId", "");
  fastify.decorateRequest("session", null as unknown as NonNullable<Session>);

  fastify.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      try {
        const url = new URL(
          request.url,
          `http://${request.headers.host ?? "localhost"}`,
        );
        const req = new Request(url.toString(), {
          method: request.method,
          headers: fromNodeHeaders(request.headers),
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        const response = await auth.handler(req);

        reply.status(response.status);
        const setCookies = response.headers.getSetCookie();
        if (setCookies.length > 0) {
          reply.header("set-cookie", setCookies);
        }
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() !== "set-cookie") {
            reply.header(key, value);
          }
        });

        return reply.send(response.body ? await response.text() : null);
      } catch (error) {
        request.log.error({ error }, "Better Auth handler failed");
        return reply
          .status(500)
          .send({ error: "Authentication error", code: "AUTH_HANDLER_ERROR" });
      }
    },
  });
});

/**
 * Route preHandler that enforces a valid session. First operation in every
 * protected handler: extracts `userId` from the session, returns 401 if
 * absent, then lets the handler proceed.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    await reply
      .status(401)
      .send({ error: "Unauthorized", code: "UNAUTHENTICATED" });
    return;
  }

  request.userId = session.user.id;
  request.session = session;
}
