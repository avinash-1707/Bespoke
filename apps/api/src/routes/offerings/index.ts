import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../plugins/auth";
import * as offeringsService from "../../services/offerings";
import {
  addSourceBody,
  createOfferingBody,
  offeringIdParams,
  updateOfferingBody,
} from "./schema";

const NOT_FOUND = { error: "Offering not found", code: "NOT_FOUND" } as const;

/**
 * Offering routes. `requireAuth` runs first for every route (auth before any
 * data access); ownership is enforced inside the service by filtering on
 * `user_id`. Handlers stay thin — all logic lives in the service.
 */
export async function offeringRoutes(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("preHandler", requireAuth);

  app.get("/", async (request) => ({
    data: await offeringsService.listOfferings(request.userId),
  }));

  app.get(
    "/:id",
    { schema: { params: offeringIdParams } },
    async (request, reply) => {
      const offering = await offeringsService.getOffering(
        request.userId,
        request.params.id,
      );
      if (!offering) return reply.status(404).send(NOT_FOUND);
      return { data: offering };
    },
  );

  app.post(
    "/",
    { schema: { body: createOfferingBody } },
    async (request, reply) => {
      const offering = await offeringsService.createOffering(
        request.userId,
        request.body,
      );
      return reply.status(201).send({ data: offering });
    },
  );

  app.patch(
    "/:id",
    { schema: { params: offeringIdParams, body: updateOfferingBody } },
    async (request, reply) => {
      const offering = await offeringsService.updateOffering(
        request.userId,
        request.params.id,
        request.body,
      );
      if (!offering) return reply.status(404).send(NOT_FOUND);
      return { data: offering };
    },
  );

  app.delete(
    "/:id",
    { schema: { params: offeringIdParams } },
    async (request, reply) => {
      const deleted = await offeringsService.deleteOffering(
        request.userId,
        request.params.id,
      );
      if (!deleted) return reply.status(404).send(NOT_FOUND);
      return reply.status(204).send();
    },
  );

  app.post(
    "/:id/sources",
    { schema: { params: offeringIdParams, body: addSourceBody } },
    async (request, reply) => {
      const offering = await offeringsService.addOfferingSource(
        request.userId,
        request.params.id,
        request.body.url,
      );
      if (!offering) return reply.status(404).send(NOT_FOUND);
      return reply.status(202).send({ data: offering });
    },
  );
}
