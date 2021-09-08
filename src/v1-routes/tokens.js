const { getCurrencyStats, getTableRows } = require("../libs/eosio-lib");



async function tokenSupplyHandler(request, reply) {
    const contract = request.params.contract;
    const symbol = request.params.symbol;
    /*
    if (contract == 'apx' && symbol == 'APX') {
        let configRows = await getTableRows({
            code: contract,
            scope: contract,
            table: 'config'
        })
        let config = configRows.rows[0];
        var supply = parseFloat(config.total_supply.split(' ')[0]);
        if (isNaN(supply))
            throw new Error("Failed to get supply instead got config.total_supply with value of " + config.total_supply);
    
        return supply;
    }
    */

    const stats = await getCurrencyStats(contract, symbol);
    var supply = parseFloat(stats.supply);
    if (isNaN(supply))
        throw new Error("Failed to get supply instead got stats with value of " + stats);

    return supply;
}

module.exports = async (fastify, options) => {
    fastify.get('token/supply/:contract/:symbol', {
        schema: {
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