import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createRewardQueue } from '../../queues/rewardQueue';

export default fp(async function (fastify: FastifyInstance) {
    const rewardQueue = createRewardQueue(fastify);
    fastify.decorate('rewardQueue', rewardQueue);
}); 