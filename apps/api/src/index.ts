import Fastify, { type FastifyError } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { config } from "./config";
import { corsPlugin } from "./plugins/cors";
import { authPlugin, requireAuth } from "./plugins/auth";
import { offeringRoutes } from "./routes/offerings/index";
import { promptRoutes } from "./routes/prompts/index";
import { prospectRoutes } from "./routes/prospects/index";

/**
 * Fastify bootstrap. CORS is registered before the auth handler. Zod drives
 * request validation and response serialization. Domain route plugins mount
 * under their `/api/*` prefixes.
 */
async function main(): Promise<void> {
  const app = Fastify({
    logger: { level: config.NODE_ENV === "production" ? "info" : "debug" },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Map validation and unexpected errors to the standard { error, code } shape.
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply
        .status(400)
        .send({ error: "Invalid request", code: "VALIDATION_ERROR" });
    }
    request.log.error({ error }, "Unhandled error");
    const status = error.statusCode ?? 500;
    return reply.status(status).send({
      error: status >= 500 ? "Internal server error" : error.message,
      code: error.code ?? "INTERNAL_ERROR",
    });
  });

  await app.register(corsPlugin);
  await app.register(authPlugin);

  app.get("/health", async () => ({ data: { status: "ok" } }));

  app.get("/api/me", { preHandler: requireAuth }, async (request) => ({
    data: { user: request.session.user },
  }));

  await app.register(offeringRoutes, { prefix: "/api/offerings" });
  await app.register(promptRoutes, { prefix: "/api/prompts" });
  await app.register(prospectRoutes, { prefix: "/api/prospects" });

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
