import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../plugins/auth";
import * as generationsService from "../../services/generations";
import {
  createGenerationBody,
  generationIdParams,
  listGenerationsQuery,
} from "./schema";

/** Generation routes — start a generation, poll one, list a prospect's history. */
export async function generationRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("preHandler", requireAuth);

  app.get(
    "/",
    { schema: { querystring: listGenerationsQuery } },
    async (request) => ({
      data: await generationsService.listMessages(
        request.userId,
        request.query.prospectId,
      ),
    }),
  );

  app.get(
    "/:id",
    { schema: { params: generationIdParams } },
    async (request, reply) => {
      const generation = await generationsService.getGeneration(
        request.userId,
        request.params.id,
      );
      if (!generation) {
        return reply
          .status(404)
          .send({ error: "Generation not found", code: "NOT_FOUND" });
      }
      return { data: generation };
    },
  );

  app.post(
    "/",
    { schema: { body: createGenerationBody } },
    async (request, reply) => {
      const result = await generationsService.createGeneration(
        request.userId,
        request.body,
      );
      if (result.status === "not_found") {
        return reply.status(404).send({
          error: "Offering, prompt, or prospect not found",
          code: "NOT_FOUND",
        });
      }
      if (result.status === "no_context") {
        return reply.status(409).send({
          error: "Prospect context is not ready yet — wait for assets to finish",
          code: "CONTEXT_NOT_READY",
        });
      }
      return reply.status(202).send({ data: result.generation });
    },
  );
}
