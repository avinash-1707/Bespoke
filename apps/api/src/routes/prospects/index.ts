import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../plugins/auth";
import * as prospectsService from "../../services/prospects";
import {
  addAssetBody,
  batchDeleteBody,
  createProspectBody,
  listQuery,
  prospectIdParams,
  updateProspectBody,
} from "./schema";

const NOT_FOUND = { error: "Prospect not found", code: "NOT_FOUND" } as const;

/** Prospect routes. Auth first; ownership enforced in the service via user_id. */
export async function prospectRoutes(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("preHandler", requireAuth);

  app.get("/", { schema: { querystring: listQuery } }, async (request) => ({
    data: await prospectsService.listProspects(request.userId, request.query),
  }));

  app.post(
    "/batch-delete",
    { schema: { body: batchDeleteBody } },
    async (request) => ({
      data: {
        deleted: await prospectsService.deleteManyProspects(
          request.userId,
          request.body.ids,
        ),
      },
    }),
  );

  app.get(
    "/:id",
    { schema: { params: prospectIdParams } },
    async (request, reply) => {
      const prospect = await prospectsService.getProspect(
        request.userId,
        request.params.id,
      );
      if (!prospect) return reply.status(404).send(NOT_FOUND);
      return { data: prospect };
    },
  );

  app.post(
    "/",
    { schema: { body: createProspectBody } },
    async (request, reply) => {
      const prospect = await prospectsService.createProspect(
        request.userId,
        request.body,
      );
      return reply.status(201).send({ data: prospect });
    },
  );

  app.patch(
    "/:id",
    { schema: { params: prospectIdParams, body: updateProspectBody } },
    async (request, reply) => {
      const prospect = await prospectsService.updateProspect(
        request.userId,
        request.params.id,
        request.body,
      );
      if (!prospect) return reply.status(404).send(NOT_FOUND);
      return { data: prospect };
    },
  );

  app.delete(
    "/:id",
    { schema: { params: prospectIdParams } },
    async (request, reply) => {
      const deleted = await prospectsService.deleteProspect(
        request.userId,
        request.params.id,
      );
      if (!deleted) return reply.status(404).send(NOT_FOUND);
      return reply.status(204).send();
    },
  );

  app.post(
    "/:id/assets",
    { schema: { params: prospectIdParams, body: addAssetBody } },
    async (request, reply) => {
      const prospect = await prospectsService.addProspectAsset(
        request.userId,
        request.params.id,
        request.body,
      );
      if (!prospect) return reply.status(404).send(NOT_FOUND);
      return reply.status(202).send({ data: prospect });
    },
  );
}
