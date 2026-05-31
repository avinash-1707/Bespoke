import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../plugins/auth";
import * as aiService from "../../services/ai";
import { explainBody } from "./schema";

/**
 * Inline AI helpers. Currently one endpoint: a plain-language explainer for the
 * offering and prompt setup surfaces. Runs on the free platform model. Auth
 * required so the helper is only reachable from inside the product.
 */
export async function aiRoutes(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("preHandler", requireAuth);

  app.post(
    "/explain",
    { schema: { body: explainBody } },
    async (request) => ({
      data: {
        text: await aiService.explain(
          request.userId,
          request.body.topic,
          request.body.draft,
        ),
      },
    }),
  );
}
