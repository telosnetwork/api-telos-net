const { getCurrencyStats, getCurrencyBalance, getRexStats } = require("../libs/eosio-lib");

const cmcCirculationExclusions = ["exrsrv.tf", "tf", "eosio.saving", "free.tf", "eosio.names",
    "econdevfunds", "eosio.ram", "ramadmin.tf", "ramlaunch.tf", "treasury.tf", "accounts.tf", "grants.tf"];

const standardCirculationExclusions = ["exrsrv.tf"];

async function circulatingSupply(requestor) {

    let exclusions = requestor === 'cmc' ? cmcCirculationExclusions : standardCirculationExclusions;

    const stats = await getCurrencyStats();
    var supply = parseFloat(stats.supply);
    if (isNaN(supply))
        throw new Error("Failed to get supply instead got stats with value of " + stats);

    for (let i = 0; i < exclusions.length; i++) {
        let accountToCheck = exclusions[i];
        let balanceString = await getCurrencyBalance(accountToCheck);
        var bal = parseFloat(balanceString, 10);
        if (isNaN(bal))
            throw new Error("Failed to get balance for " + accountToCheck + " instead got " + bal);

        supply -= bal;
    }

    console.log('supply: ' + supply + ' was ' + stats.supply);
    return supply;
}

async function totalSupply() {
    const stats = await getCurrencyStats();
    return parseFloat(stats.supply, 10);
}

async function rexApr() {
    const rex = await getRexStats();
    const totalLendable = parseFloat(rex.total_lendable);
    return ((12000000 / totalLendable) * 100).toFixed(2);
}

async function rexStaked() {
    const rex = await getRexStats();
    const totalLendable = parseFloat(rex.total_lendable);
    return totalLendable;
}

module.exports = async (fastify, options) => {
    fastify.get('supply/total', {
        schema: {
            tags: ['stats'],
            response: {
                200: {
                    example: 123456.7890,
                    type: 'number'
                }
            }
        }
    }, async (request, reply) => {
        return await totalSupply()
    })

    fastify.get('supply/circulating', {
        schema: {
            tags: ['stats'],
            querystring: {
                requestor: {
                    default: 'any',
                    type: 'string'
                }
            },
            response: {
                200: {
                    example: 123456.7890,
                    type: 'number'
                }
            }
        }
    }, async (request, reply) => {
        return await circulatingSupply(request.query.requestor)
    })

    fastify.get('/rex/staked', {
        schema: {
            tags: ['stats'],
            response: {
                200: {
                    example: 123456.7890,
                    type: 'number'
                }
            }
        }
    }, async (request, reply) => {
        return await rexStaked()
    })

    fastify.get('/rex/apr', {
        schema: {
            tags: ['stats'],
            response: {
                200: {
                    example: 12.3,
                    type: 'number'
                }
            }
        }
    }, async (request, reply) => {
        return await rexApr()
    })
}