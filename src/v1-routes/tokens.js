const { getCurrencyStats, getCurrencyBalance, getTableRows } = require("../libs/eosio-lib");



async function tokenSupplyHandler(request, reply) {
    const contract = request.params.contract;
    const symbol = request.params.symbol;
    const exclusions = request.query.exclude.split(',')

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
    console.log(`Supply is: ${supply.toFixed(4)}`)
    for (let i = 0; i < exclusions.length; i++) {
        let accountToCheck = exclusions[i];
        let balanceString = await getCurrencyBalance(accountToCheck);
        var bal = parseFloat(balanceString, 10);
        if (isNaN(bal))
            throw new Error("Failed to get balance for " + accountToCheck + " instead got " + bal);

        console.log(`${accountToCheck} has: ${bal.toFixed(4)}`)
        supply -= bal;
    }

    return supply;
}

module.exports = async (fastify, options) => {
    fastify.get('token/supply/:contract/:symbol', {
        schema: {
            querystring: {
                exclude: { 
                    default: '',
                    type: 'string' }
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