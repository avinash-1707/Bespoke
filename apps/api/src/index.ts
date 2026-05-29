import Fastify from "fastify";
import { config } from "./config";
import { corsPlugin } from "./plugins/cors";
import { authPlugin, requireAuth } from "./plugins/auth";

/**
 * Fastify bootstrap. CORS is registered before the auth handler. Domain route
 * plugins register after auth as they land in their units.
 */
async function main(): Promise<void> {
  const app = Fastify({
    logger: { level: config.NODE_ENV === "production" ? "info" : "debug" },
  });

  await app.register(corsPlugin);
  await app.register(authPlugin);

  app.get("/health", async () => ({ data: { status: "ok" } }));

  // Verifies the session pipeline end to end; returns the authed user.
  app.get("/api/me", { preHandler: requireAuth }, async (request) => ({
    data: { user: request.session.user },
  }));

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
