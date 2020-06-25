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
        host: process.env.SERVER_HOSTNAME,
        schemes: ['https', 'http'],
        tags: [
            { name: 'stats', description: 'Chain statistics endpoints' },
            { name: 'testnet', description: 'Testnet endpoints' },
            { name: 'accounts', description: 'Account creation endpoints' }
        ],
        consumes: ['application/json'],
        produces: ['application/json']
    },
    exposeRoute: true
}