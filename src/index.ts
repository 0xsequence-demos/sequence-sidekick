import Fastify from 'fastify';
import auth from './middleware/auth';
import FastifyRedis from '@fastify/redis'
import swagger from './plugins/swagger/swagger'
import prisma from './plugins/prisma/prisma'
import cors from '@fastify/cors'

const fastify = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                colorize: true,
                levelFirst: true,
                messageFormat: '{msg} {reqId}',
            }
        }
    },
    connectionTimeout: 60000,
    ajv: {
        customOptions: {
            removeAdditional: false,
            useDefaults: true,
            coerceTypes: true,
            allErrors: true
        }
    }
});

// Register CORS
await fastify.register(cors, {
    origin: true, // Allow all origins in development
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-secret-key'],
    credentials: true
})

// Register Prisma plugin
await fastify.register(prisma)

// Register Swagger
await fastify.register(swagger)

// Register Redis plugin
fastify.register(FastifyRedis, {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || 'sequence',
    closeClient: true
})

// Then register routes
await fastify.register(import('./routes'));

fastify.addHook('preHandler', auth);

// fastify.addHook('preHandler', async (request, done) => {
//     if (request.url.includes('/write')) {
//         const txService = new TransactionService(fastify);

//         const { chainId, contractAddress, functionName } = request.params as any;
//         const { args } = request.body as any;
//         // Create pending transaction first
//         const pendingTx = await txService.createPendingTransaction({ chainId, contractAddress, data: { functionName, args: args ?? [] } });
//     }
// })

// fastify.addHook('onResponse', async (request, reply): Promise<void> => {
//     if (request.url.includes('/write')) {
//         // Get the response payload from reply
//         const response = await reply.raw.payload
//         console.log('Response 123:', response);
//     }
// })

// Start server
try {
    await fastify.listen({ 
        port: Number(process.env.PORT || 3000), 
        host: process.env.HOST || '0.0.0.0' // This ensures the server is accessible from outside
    });
    fastify.log.info('Access swagger at http://localhost:3000/documentation');
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}