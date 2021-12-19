const { getCurrencyStats } = require("../libs/eosio-lib");
const { exclude } = require("../utils/exclude");


async function tokenSupplyHandler(request, reply) {
    let supply;
    const contract = request.params.contract;
    const symbol = request.params.symbol;
    const stats = await getCurrencyStats(contract, symbol);
    if (request.query.exclude){
        const exclusions = request.query.exclude.split(',');
        return await exclude(stats, exclusions, contract, symbol) 
    } 
    return stats.supply;
}

module.exports = async (fastify, options) => {
    fastify.get('token/supply/:contract/:symbol', {
        schema: {
            querystring: {
                exclude: { 
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