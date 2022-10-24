const moment = require('moment');
const { getCurrencyStats, getCurrencyBalance, getRexStats, getActionStats } = require("../libs/eosio-lib");
const { exclude } = require('../utils/exclude');
const { getTableRows } = require("../libs/eosio-lib");
const Big = require('big.js');
const { BigNumber, ethers } = require('ethers');

const cmcCirculationExclusions = ["exrsrv.tf", "tlosrecovery", "treasury.tcd", "works.decide", "tf", "eosio.saving", "free.tf", "eosio.names",
    "econdevfunds", "eosio.ram", "ramadmin.tf", "ramlaunch.tf", "treasury.tf", "accounts.tf", "grants.tf"];

const standardCirculationExclusions = ["exrsrv.tf", "tlosrecovery"];

async function circulatingSupply(requestor) {

    //let exclusions = requestor === 'cmc' ? cmcCirculationExclusions : standardCirculationExclusions;
    let exclusions = standardCirculationExclusions;

    const stats = await getCurrencyStats();
    const supply = await exclude(stats, exclusions);

    console.log('supply: ' + supply + ' was ' + stats.supply);
    return supply;
}

async function totalSupply() {
    const stats = await getCurrencyStats();
    return parseFloat(stats.supply, 10);
}

async function totalStaked(event, context) {
    const rex = await getRexStats();
    const stakeBalance = await getCurrencyBalance('eosio.stake');
    return parseFloat(rex.total_lendable) + parseFloat(stakeBalance);
}

async function rexApr() {
    const rex = await getRexStats();
    const totalLendable = parseFloat(rex.total_lendable);
    return ((1.7e6 * 12 / totalLendable) * 100).toFixed(2);
}

async function rexStaked() {
    const rex = await getRexStats();
    const totalLendable = parseFloat(rex.total_lendable);
    return totalLendable;
}

async function rexPrice() {
    const rex = await getRexStats();
    const totalLendable = parseFloat(rex.total_lendable);
    const totalRex = parseFloat(rex.total_rex);
    const rexTelosPrice = (totalLendable / totalRex);
    return rexTelosPrice;
}

async function blocktivityHourly() {
    let actionStats = await getActionStats(true, moment().startOf('hour'));
    return {
        last_1h_op: actionStats.action_count,
        last_1h_tx: actionStats.tx_count
    };
}

/**
 * Calculates and returns the current APY (annual percentage yield) for sTLOS
 *
 * @param   {string} tvl      - total volume locked in wei, as a string
 * @returns {Promise<string>} - calculated APY as a unitless number, eg. "33.25"
 */
 async function fetchStlosApy(tvl) {
    const apyStats = await getApyStats(tvl);

    if (!apyStats){
        return;
    }

    if (apyStats.balanceRatio === 0){
        return apyStats.balanceRatio.toString();
    }

    const stlosPayout = annualPayout.minus(rexPayout);
    const apy = stlosPayout.div(stlosTotal).times(100).toFixed(2);

    return apy;
}

/**
 * Calculates and returns the current APY (annual percentage yield) for native
 *
 * @param   {string} tvl      - total volume locked in wei, as a string
 * @returns {Promise<string>} - calculated APY as a unitless number, eg. "33.25"
 */
 async function fetchNativeApy(tvl) {
    let apyStats;

    try {
        apyStats = await getApyStats(tvl);
    }catch(e){
        console.error(e);
        return;
    }

    if (apyStats.balanceRatio === 0){
        return apyStats.balanceRatio.toString();
    }

    const rexPayout = apyStats.annualPayout.div(apyStats.balanceRatio.plus(1));
    const apy = rexPayout.div(rexTotal).times(100).toFixed(2);

    return apy;
}

/**
 * Calculates and returns the current APY (annual percentage yield) for native
 *
 * @param   {string} tvl      - total volume locked in wei, as a string
 * @returns {Promise<{balanceRatio: number, annualPayout: number}>} - calculated APY as a unitless number, eg. "33.25"
 */

async function getApyStats(tvl) {
    const tvlBn = BigNumber.from(tvl);
    const zeroBal = {balanceRatio: 0, annualPayout: 0};

    if (tvlBn.eq('0')) {
        return zeroBal;
    }

    const rexPoolResponse = await getTableRows({
        code: 'eosio',
        scope: 'eosio',
        table: 'rexpool',
        limit: '1',
    });

    if (!rexPoolResponse || !rexPoolResponse.rows.length) {
        throw 'Failed to fetch rexpool';
    }

    const distConfigResponse = await getTableRows({
        code: 'exrsrv.tf',
        scope: 'exrsrv.tf',
        table: 'config',
        limit: '1',
    });

    if (!distConfigResponse || !distConfigResponse.rows.length) {
        throw 'Failed to fetch exrsrv.tf config';
    }

    const payoutsResponse = await getTableRows({
        code: 'exrsrv.tf',
        scope: 'exrsrv.tf',
        table: 'payouts',
        limit: '100',
    });

    if (!payoutsResponse || !payoutsResponse.rows.length) {
        throw 'Failed to fetch exrsrv.tf payouts';
    }

    const rexStats = rexPoolResponse.rows[0];
    const distConfig = distConfigResponse.rows[0];
    const payoutRow = payoutsResponse.rows.find((row) => row.to === 'eosio.rex');

    const annualPayout = new Big(payoutRow.amount).times(new Big(60 * 60 * 24 * 365).div(payoutRow.interval));
    const fixedRatio = new Big(distConfig.ratio).div(100);
    const rexTotal = new Big(rexStats.total_lendable.split(' ')[0]);
    const stlosTotal = new Big(ethers.utils.formatEther(tvlBn));

    const balanceRatio = rexTotal.eq(0) ? -1 : stlosTotal.times(fixedRatio).div(rexTotal.add(stlosTotal));

    if (apyStats.balanceRatio.eq(0)) {
        return zeroBal;
    }

    return  { balanceRatio, annualPayout };
}


module.exports = async (fastify, options) => {
    fastify.get('stats/blocktivity', {
        schema: {
            tags: ['stats'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        last_1h_op: {
                            type: 'number',
                            example: 123456789
                        },
                        last_1h_tx: {
                            type: 'number',
                            example: 123456
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        return await blocktivityHourly()
    })

    fastify.get('supply/staked', {
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
        return await totalStaked()
    })

    fastify.get('apy/evm', {
        schema: {
            tags: ['stats'],
            querystring: {
                tvl: {
                    example: "1234567890",
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
        return await fetchStlosApy(request.query.tvl)
    })

    fastify.get('apy/rex', {
        schema: {
            tags: ['stats'],
            querystring: {
                tvl: {
                    example: "1234567890",
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
        return await fetchNativeApy(request.query.tvl)
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

    fastify.get('/rex/price', {
        schema: {
            tags: ['stats'],
            response: {
                200: {
                    example: 0.0123456,
                    type: 'number'
                }
            }
        }
    }, async (request, reply) => {
        return await rexPrice()
    })
}