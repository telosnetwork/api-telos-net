require('dotenv').config()
const AutoLoad = require('fastify-autoload')
const LoggerFactory = require('./LoggerFactory')
const path = require('path')

const logger = LoggerFactory.create('TelosAPI')

const fastify = require('fastify')({
    logger
})

fastify.register(require('fastify-oas'), require('../swaggerOpts.js'))

fastify.register(AutoLoad, { dir: path.join(__dirname, 'v1-routes'), options: { prefix: '/v1/' } });

fastify.get('/', (request, reply) => {
    reply.code(307).redirect('/v1/docs')
});

fastify.get('/v1/health', { logLevel: 'fatal' }, (request, reply) => {
    reply.code(200).send("Ok!")
});


fastify.ready(err => {
    if (err) {
        logger.info(`Error starting fastify - ${err.message}`)
        throw err
    }
    fastify.oas()
})

fastify.listen(3000, '0.0.0.0', err => {
    if (err) throw err
})