require('dotenv').config()
const fastify = require('fastify')()
const AutoLoad = require('fastify-autoload')
const path = require('path')

fastify.register(require('fastify-oas'), require('./swaggerOpts.js'))

fastify.register(AutoLoad, { dir: path.join(__dirname, 'v1-routes'), options: { prefix: '/v1/' } });

fastify.ready(err => {
    if (err) throw err
    fastify.oas()
})

fastify.listen(3000, err => {
    if (err) throw err
    console.log(`server listening on ${fastify.server.address().port}`)
})