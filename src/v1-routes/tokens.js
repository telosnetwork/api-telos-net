const { getCurrencyStats } = require("../libs/eosio-lib");
const { getMarketdata } = require("../libs/dynamodb-lib");
const { getTokens, getSymbolsArray } = require("../libs/evm-lib");
const { exclude } = require("../utils/exclude");

// MARKETDATA HISTORICAL ------------------------------------------------------
const tokenMarketDataHistoricalOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                symbols: {
                    description: 'The comma separated token symbol list (i.e. TLOS,BTC,ETH)',
                    type: 'string',
                },
                after: {
                    description: 'Collected after millisecond epoch',
                    type: 'number',
                },
                before: {
                    description: 'Collected before millisecond epoch',
                    type: 'number'
                },
            },
            required: ['symbols'],
        },
        tags: ['tokens', 'evm'],
        response: {
            400: {
                type: 'string'
            },
            404: {
                type: 'string'
            },
            200: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        symbol: { type: 'string' },
                        datapoints: {
                            type: 'object',
                            properties: {
                                symbol: { type: 'string' },
                                collected: { type: 'number' },
                                price: { type: 'number' },
                                supply: { type: 'string' },
                                max_supply: { type: 'string' },
                                market_cap: { type: 'string' },
                                volume: { type: 'string' }
                            }
                        },
                    }
                }
            }
        }
    }
}

async function tokenMarketDataHistoricalHandler(request, reply) {
    const symbols = getSymbolsArray(request.query?.symbols);
    if(!symbols || symbols.length === 0){
        return reply.code(400).send('Bad request: No symbol(s) passed');
    }

    // To implement...

    return reply.code(200).send({});
}

// MARKETDATA CURRENT ------------------------------------------------------
const tokenMarketDataOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                symbols: {
                    description: 'The comma separated token symbol list (i.e. TLOS,BTC,ETH)',
                    type: 'string',
                },
            },
            required: ['symbols'],
        },
        tags: ['tokens', 'evm'],
        response: {
            400: {
                type: 'string'
            },
            404: {
                type: 'string'
            },
            200: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        symbol: { type: 'string' },
                        collected: { type: 'number' },
                        price: { type: 'number' },
                        supply: { type: 'string' },
                        max_supply: { type: 'string' },
                        market_cap: { type: 'string' },
                        volume: { type: 'string' }
                    }
                }
            }
        }
    }
}

async function tokenMarketDataHandler(request, reply) {
    const symbols = getSymbolsArray(request.query?.symbols.trim())
    if(!symbols || symbols.length === 0 || symbols.length === 1 && symbols[0] === ''){
        return reply.code(400).send('Bad request: No symbol(s) passed');
    }
    const stats = await getMarketdata(await getTokens(symbols));
    if(stats.length === 0){
        return reply.code(404).send('Not found: No token market data was found for the symbol(s) provided');
    }
    return reply.code(200).send(stats);
}


// SUPPLY ------------------------------------------------------

const tokenSupplyOpts = {
    schema: {
        querystring: {
            exclude: {
                description: 'Comma separated list of accounts to exclude from the total (i.e. thisisnotjoe,thisisnottim).',
                type: 'string'
            },
            numeric: {
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
}

async function tokenSupplyHandler(request, reply) {
    const contract = request.params.contract;
    const symbol = request.params.symbol.toUpperCase();
    const numeric = (request.query.numeric + '') === 'true';
    console.log(request.query.numeric);
    console.log(numeric);
    const stats = await getCurrencyStats(contract, symbol);
    let supply = stats.supply;
    if (numeric)
        console.log("Numeric is true");
    if (request.query.exclude){
        const exclusions = request.query.exclude.split(',');
        supply = await exclude(stats, exclusions, contract, symbol);
        // Hacky, but easier for now than trying to fix the logic of the exclude function and the other consumers of it to add an argument for "includeSymbol"
        return numeric ? supply : `${supply} ${symbol}`;
    }
    return numeric ? supply.split(' ')[0] : supply;
}

// EXPORTS ------------------------------------------------------

module.exports = async (fastify, options) => {
    fastify.get('evm/tokens/marketdata/historical', tokenMarketDataHistoricalOpts, tokenMarketDataHistoricalHandler);
    fastify.get('evm/tokens/marketdata', tokenMarketDataOpts, tokenMarketDataHandler);
    fastify.get('token/supply/:contract/:symbol', tokenSupplyOpts, tokenSupplyHandler);
}
