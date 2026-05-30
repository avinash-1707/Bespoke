import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../plugins/auth";
import * as analyticsService from "../../services/analytics";

/** Analytics dashboard — aggregated activity for the signed-in user. */
export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("preHandler", requireAuth);

  app.get("/dashboard", async (request) => ({
    data: await analyticsService.getDashboard(request.userId),
  }));
}
