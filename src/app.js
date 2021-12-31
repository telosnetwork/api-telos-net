require('dotenv').config()
const AutoLoad = require('fastify-autoload')
const fastifyCors = require('fastify-cors')
const fastifyGracefulShutdown = require('fastify-graceful-shutdown')
const LoggerFactory = require('./LoggerFactory')
const path = require('path')

const logger = LoggerFactory.create('TelosAPI')
const port = process.env.SERVER_PORT || 9999

logger.info(`Starting API with mode ${process.env.MODE} and SERVER_ENDPOINT ${process.env.SERVER_ENDPOINT} and SERVER_PORT ${process.env.SERVER_PORT}`)


const fastify = require('fastify')({
    trustProxy: true,
    logger,
    ajv: {
        customOptions: {
            unknownFormats: ['binary']
        }
    }
})

fastify.register(fastifyGracefulShutdown)

fastify.register(require('fastify-oas'), require('../swaggerOpts.js'))

fastify.register(fastifyCors, { origin: true })

fastify.register(AutoLoad, { dir: path.join(__dirname, 'v1-routes'), options: { prefix: '/v1/' } });

fastify.get('/', { schema: { hide: true } }, (request, reply) => {
    reply.code(307).redirect('/v1/docs')
});

fastify.get('/v1/health', { logLevel: 'fatal', schema: { hide: true } }, (request, reply) => {
    reply.code(200).send("Ok!")
});


fastify.ready(err => {
    if (err) {
        logger.info(`Error starting fastify - ${err.message}`)
        throw err
    }
    fastify.oas()
})

fastify.listen(port, '0.0.0.0', err => {
    if (err) throw err
})