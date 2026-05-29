import fp from "fastify-plugin";
import cors from "@fastify/cors";
import { config } from "../config";

/**
 * CORS must be registered before the auth handler. Credentials are enabled so
 * the browser sends the Better Auth session cookie cross-origin (web → api).
 */
export const corsPlugin = fp(async (fastify) => {
  await fastify.register(cors, {
    origin: config.WEB_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86400,
  });
});
