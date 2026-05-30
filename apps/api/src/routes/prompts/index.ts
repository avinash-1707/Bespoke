import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../plugins/auth";
import * as promptsService from "../../services/prompts";
import {
  batchDeleteBody,
  createPromptBody,
  listQuery,
  promptIdParams,
  updatePromptBody,
} from "./schema";

const NOT_FOUND = { error: "Prompt not found", code: "NOT_FOUND" } as const;

/** Prompt routes. Auth first; ownership enforced in the service via user_id. */
export async function promptRoutes(fastify: FastifyInstance): Promise<void> {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  app.addHook("preHandler", requireAuth);

  app.get("/", { schema: { querystring: listQuery } }, async (request) => ({
    data: await promptsService.listPrompts(request.userId, request.query),
  }));

  app.post(
    "/batch-delete",
    { schema: { body: batchDeleteBody } },
    async (request) => ({
      data: {
        deleted: await promptsService.deleteManyPrompts(
          request.userId,
          request.body.ids,
        ),
      },
    }),
  );

  app.get(
    "/:id",
    { schema: { params: promptIdParams } },
    async (request, reply) => {
      const prompt = await promptsService.getPrompt(
        request.userId,
        request.params.id,
      );
      if (!prompt) return reply.status(404).send(NOT_FOUND);
      return { data: prompt };
    },
  );

  app.post(
    "/",
    { schema: { body: createPromptBody } },
    async (request, reply) => {
      const prompt = await promptsService.createPrompt(
        request.userId,
        request.body,
      );
      return reply.status(201).send({ data: prompt });
    },
  );

  app.patch(
    "/:id",
    { schema: { params: promptIdParams, body: updatePromptBody } },
    async (request, reply) => {
      const prompt = await promptsService.updatePrompt(
        request.userId,
        request.params.id,
        request.body,
      );
      if (!prompt) return reply.status(404).send(NOT_FOUND);
      return { data: prompt };
    },
  );

  app.delete(
    "/:id",
    { schema: { params: promptIdParams } },
    async (request, reply) => {
      const deleted = await promptsService.deletePrompt(
        request.userId,
        request.params.id,
      );
      if (!deleted) return reply.status(404).send(NOT_FOUND);
      return reply.status(204).send();
    },
  );
}
