import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config";

/**
 * Fastify bootstrap. Domain route plugins, the auth plugin, and the db/queue
 * plugins are registered here as they land in their respective units. For the
 * scaffold this exposes CORS and a health check so the app boots and deploys.
 */
async function main(): Promise<void> {
  const app = Fastify({
    logger: { level: config.NODE_ENV === "production" ? "info" : "debug" },
  });

  await app.register(cors, {
    origin: config.WEB_ORIGIN,
    credentials: true,
  });

  app.get("/health", async () => ({ data: { status: "ok" } }));

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
