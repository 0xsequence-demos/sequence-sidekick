import type { FastifyInstance } from "fastify";
import { SequenceIndexer } from "@0xsequence/indexer";
import type { AddWebhookResponse } from "./addWebhook";

// Types for request/response
type RemoveWebhookRequestBody = {
    webhookId: string;
}

export type RemoveWebhookResponse = {
    result?: {
        status: boolean;
        error?: string;
    };
}

const RemoveWebhookSchema = {
    tags: ['Webhooks'],
    headers: {
        type: 'object',
        properties: {
            'x-secret-key': { type: 'string' }
        },
        required: ['x-secret-key']
    },
    body: {
        type: 'object',
        properties: {
            webhookId: { type: 'string' },
        },
        required: ['webhookId'],
    },
}

export async function removeWebhook(fastify: FastifyInstance) {
    fastify.post<{
        Body: RemoveWebhookRequestBody;
        Reply: RemoveWebhookResponse;
    }>('/webhook/remove', {
        schema: RemoveWebhookSchema
    }, async (request, reply) => {
        try {
            const { webhookId } = request.body;

            const indexerClient = new SequenceIndexer(process.env.INDEXER_URL!, process.env.PROJECT_ACCESS_KEY!, process.env.INDEXER_SECRET_KEY!)

            const response = await indexerClient.removeWebhookListener({
                id: Number(webhookId)
            })

            return reply.code(200).send({
                result: {
                    status: response.status
                }
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                result: {
                    status: false,
                    error: error instanceof Error ? error.message : 'Failed to remove webhook'
                }
            });
        }
    });
}