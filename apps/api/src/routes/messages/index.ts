import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../plugins/auth";
import * as generationsService from "../../services/generations";
import { favoriteBody, messageIdParams, rateBody } from "./schema";

const NOT_FOUND = { error: "Message not found", code: "NOT_FOUND" } as const;

/** Per-message actions — rate, favourite, copy, delete, regenerate. */
export async function messageRoutes(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("preHandler", requireAuth);

  app.patch(
    "/:id/rating",
    { schema: { params: messageIdParams, body: rateBody } },
    async (request, reply) => {
      const ok = await generationsService.rateMessage(
        request.userId,
        request.params.id,
        request.body.rating,
        request.body.feedback,
      );
      if (!ok) return reply.status(404).send(NOT_FOUND);
      return { data: { ok: true } };
    },
  );

  app.patch(
    "/:id/favorite",
    { schema: { params: messageIdParams, body: favoriteBody } },
    async (request, reply) => {
      const ok = await generationsService.setFavorite(
        request.userId,
        request.params.id,
        request.body.isFavorite,
      );
      if (!ok) return reply.status(404).send(NOT_FOUND);
      return { data: { ok: true } };
    },
  );

  app.post(
    "/:id/copy",
    { schema: { params: messageIdParams } },
    async (request, reply) => {
      const ok = await generationsService.incrementCopy(
        request.userId,
        request.params.id,
      );
      if (!ok) return reply.status(404).send(NOT_FOUND);
      return { data: { ok: true } };
    },
  );

  app.delete(
    "/:id",
    { schema: { params: messageIdParams } },
    async (request, reply) => {
      const ok = await generationsService.deleteMessage(
        request.userId,
        request.params.id,
      );
      if (!ok) return reply.status(404).send(NOT_FOUND);
      return reply.status(204).send();
    },
  );

  app.post(
    "/:id/regenerate",
    { schema: { params: messageIdParams } },
    async (request, reply) => {
      const result = await generationsService.regenerate(
        request.userId,
        request.params.id,
      );
      if (!result || result.status === "not_found") {
        return reply.status(404).send(NOT_FOUND);
      }
      if (result.status === "no_context") {
        return reply.status(409).send({
          error: "Prospect context is not ready yet",
          code: "CONTEXT_NOT_READY",
        });
      }
      return reply.status(202).send({ data: result.generation });
    },
  );
}
