import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { SUPPORTED_MODELS } from "@bespoke/shared";
import { requireAuth } from "../../plugins/auth";
import * as settingsService from "../../services/settings";
import { openRouterKeyBody, updateSettingsBody } from "./schema";

/**
 * User settings. The model list is served alongside the current value so the
 * web app renders the dropdown without hardcoding slugs. Non-free models route
 * through the user's own OpenRouter key, managed via the key endpoints below.
 * Auth required.
 */
export async function settingsRoutes(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("preHandler", requireAuth);

  app.get("/", async (request) => ({
    data: {
      ...(await settingsService.getSettings(request.userId)),
      supportedModels: SUPPORTED_MODELS,
    },
  }));

  app.patch(
    "/",
    { schema: { body: updateSettingsBody } },
    async (request, reply) => {
      const result = await settingsService.updateSettings(
        request.userId,
        request.body.generationModel,
      );
      if (!result.ok) {
        return reply.status(409).send({
          error: "This model requires your own OpenRouter key",
          code: "OPENROUTER_KEY_REQUIRED",
        });
      }
      return { data: result.settings };
    },
  );

  app.post(
    "/openrouter-key",
    { schema: { body: openRouterKeyBody } },
    async (request, reply) => {
      const result = await settingsService.setOpenRouterKey(
        request.userId,
        request.body.apiKey,
      );
      if (!result.ok) {
        return reply.status(400).send({
          error: "OpenRouter rejected this key",
          code: "INVALID_OPENROUTER_KEY",
        });
      }
      return { data: { hasOpenRouterKey: true } };
    },
  );

  app.delete("/openrouter-key", async (request) => ({
    data: await settingsService.removeOpenRouterKey(request.userId),
  }));
}
