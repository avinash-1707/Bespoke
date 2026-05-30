import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { SUPPORTED_MODELS } from "@bespoke/shared";
import { requireAuth } from "../../plugins/auth";
import * as settingsService from "../../services/settings";
import { updateSettingsBody } from "./schema";

/**
 * User settings. The model list is served alongside the current value so the
 * web app renders the dropdown without hardcoding slugs. Auth required.
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
    async (request) => ({
      data: await settingsService.updateSettings(
        request.userId,
        request.body.generationModel,
      ),
    }),
  );
}
