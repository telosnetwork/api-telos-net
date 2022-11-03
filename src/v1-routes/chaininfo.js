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
 * @returns {Promise<string>} - calculated APY as a unitless number, eg. "33.25"
 */
 async function fetchStlosApy() {
    try {
        return (await getApyStats()).evm;
    }catch(e){
        console.error(e);
        return;
    }
}

/**
 * Calculates and returns the current APY (annual percentage yield) for native
 *
 * @returns {Promise<string>} - calculated APY as a unitless number, eg. "33.25"
 */
 async function fetchNativeApy() {
    try {
        return (await getApyStats()).native;
    }catch(e){
        console.error(e);
        return;
    }
}

/**
 * Calculates and returns the current APY (annual percentage yield) for native
 *
 * @param   {string} tvl      - total volume locked in wei, as a string
 * @returns {Promise<{balanceRatio: number, annualPayout: number}>} - calculated APY as a unitless number, eg. "33.25"
 */

async function getApyStats() {
    const tvlTest = await getTvl();
    const tvlBn = BigNumber.from(tvlTest);
    const zeroBal = {native: 0, evm: 0};

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

    if (balanceRatio.eq(0)) {
        return zeroBal;
    }

    const rexPayout = annualPayout.div(balanceRatio.plus(1));
    const rexApy = rexPayout.div(rexTotal).times(100).toFixed(2);
    const stlosPayout = annualPayout.minus(rexPayout);
    const evmApy = stlosPayout.div(stlosTotal).times(100).toFixed(2);

    return  { native: rexApy, evm: evmApy };
}

async function getTvl(){
    const stlosContractAddress = "0xb4b01216a5bc8f1c8a33cd990a1239030e60c905";
    const stlosAbi = [{"inputs":[{"internalType":"contract IERC20Metadata","name":"asset_","type":"address"},{"internalType":"contract ITelosEscrow","name":"escrow_","type":"address"},{"internalType":"address","name":"admin_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"assets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"assets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[],"name":"_admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_escrow","outputs":[{"internalType":"contract ITelosEscrow","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"asset","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"convertToAssets","outputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"convertToShares","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"depositTLOS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"maxDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"maxMint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"maxRedeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"maxWithdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"previewDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"previewMint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"previewRedeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"previewWithdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"redeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"admin_","type":"address"}],"name":"setAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ITelosEscrow","name":"escrow_","type":"address"}],"name":"setEscrow","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalAssets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
    const provider =  getEthersProvider();   
    const contract = new ethers.Contract(stlosContractAddress, stlosAbi, provider);

    const stlosTvl = (await contract.totalAssets()).toString();
    
    return stlosTvl; 
}

function getEthersProvider() {
    return new ethers.providers.JsonRpcProvider('https://mainnet.telos.net/evm');
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
                type: 'object',
                  properties: {
                    tvl: {
                      type: 'string'
                    },
                },
                required: ['tvl']
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
                type: 'object',
                  properties: {
                    tvl: {
                      type: 'string'
                    },
                },
                required: ['tvl']
            },
            response: {
                200: {
                    example: 123456.7890,
                    type: 'number'
                }
            }
        }
    }, async (request, reply) => {
        return await  fetchNativeApy(request.query.tvl);
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