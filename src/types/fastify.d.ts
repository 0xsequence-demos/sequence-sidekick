import '@fastify/redis'
import { Redis } from 'ioredis'
import 'fastify'
import type { Queue } from 'bull'

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
    isRedisHealthy: () => Promise<boolean>
    rewardQueue: Queue
  }
}    