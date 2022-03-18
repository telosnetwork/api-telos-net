const { getCurrencyStats } = require("../libs/eosio-lib");
const { exclude } = require("../utils/exclude");


async function tokenSupplyHandler(request, reply) {
    const contract = request.params.contract;
    const symbol = request.params.symbol;
    const numeric = request.query.numeric;
    const stats = await getCurrencyStats(contract, symbol);
    if (request.query.exclude){
        const exclusions = request.query.exclude.split(',');
        return await exclude(stats, exclusions, contract, symbol);
    } 
    return numeric ? stats.supply.split(' ')[0] : stats.supply;
}

module.exports = async (fastify, options) => {
    fastify.get('token/supply/:contract/:symbol', {
        schema: {
            querystring: {
                exclude: { 
                    type: 'string' 
                },
                'numeric': {
                    description: 'If the response should be numeric only or should include the symbol, if true the symbol will be left off the response.',
                    type: 'boolean',
                    default: false
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
                    },
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