module.exports = {
    routePrefix: '/v1/docs',
    swagger: {
        info: {
            title: 'api.telos.net',
            description: 'Telos Network APIs',
            version: '0.1.0'
        },
        externalDocs: {
            url: 'https://docs.telos.net',
            description: 'Find more info here'
        },
        host: 'localhost:3000',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json']
    },
    exposeRoute: true
}