const { getCurrencyStats } = require("../libs/eosio-lib");
const { exclude } = require("../utils/exclude");


async function tokenSupplyHandler(request, reply) {
    const contract = request.params.contract;
    const symbol = request.params.symbol;
    const exclusions = request.query.exclude.split(',');
    const stats = await getCurrencyStats(contract, symbol);
    const supply = await exclude(stats, exclusions)

    return supply;
}

module.exports = async (fastify, options) => {
    fastify.get('token/supply/:contract/:symbol', {
        schema: {
            querystring: {
                exclude: { 
                    default: '',
                    type: 'string' 
                }
            },
            params: {
                type: 'object',
                properties: {
                    'contract': {
                        description: 'Token contract account name',
                        type: 'string'
                    },
                    'symbol': {
                        description: 'The token symbol (i.e. TLOS)',
                        type: 'string'
                    }
                },
                required: ['contract','symbol']
            },
            tags: ['tokens'],
            response: {
                200: {
                    example: 123456.7890,
                    type: 'number'
                }
            }
        }
    }, tokenSupplyHandler)
}