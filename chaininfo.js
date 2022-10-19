import { getCurrencyStats, getCurrencyBalance, getRexStats } from "./libs/eosio-lib";
import { respond } from './libs/response-lib';
import { exclude } from "./src/utils/exclude";
import { getTableRows } from "./src/libs/eosio-lib";
import Big from 'big.js';
import { BigNumber, ethers } from 'ethers';

const cmcCirculationExclusions = ["exrsrv.tf", "tf", "eosio.saving", "free.tf", "eosio.names",
    "econdevfunds", "eosio.ram", "ramadmin.tf", "ramlaunch.tf", "treasury.tf", "accounts.tf", "grants.tf"];

const standardCirculationExclusions = ["exrsrv.tf"];

export async function circulatingSupply(event, context) {
    let exclusions = standardCirculationExclusions;
    if (event.queryStringParameters &&
        event.queryStringParameters.requestor &&
        event.queryStringParameters.requestor.toLowerCase() == "cmc") {
        exclusions = cmcCirculationExclusions;
    }

    const stats = await getCurrencyStats();
    const supply = await exclude(stats, exclusions, includeSymbol=false);

    console.log('supply: ' + supply + ' was ' + stats.supply);
    return respond(200, supply);
}

export async function totalSupply(event, context) {
    const stats = await getCurrencyStats();
    console.log('total supply from stats: ' + stats.supply);
    return respond(200, parseFloat(stats.supply, 10));
}

export async function totalStaked(event, context) {
    const rex = await getRexStats();
    const stakeBalance = await getCurrencyBalance('eosio.stake');
    return respond(200, (parseFloat(rex.total_lendable) + parseFloat(stakeBalance)));
}

// export async function rexApr(event, context) {
//     const rex = await getRexStats();
//     const totalLendable = parseFloat(rex.total_lendable);
//     return respond(200, ((1.7e6 * 12 / totalLendable) * 100).toFixed(2));
// }

/**
 * Calculates and returns the current APY (annual percentage yield) for sTLOS
 *
 * @param   {string} tvl      - total volume locked in wei, as a string
 * @returns {Promise<string>} - calculated APY as a unitless number, eg. "33.25"
 */
 export async function fetchStlosApy(tvl) {
    const tvlBn = BigNumber.from(tvl);

    if (tvlBn.eq('0')) {
        return '0';
    }

    const rexPoolResponse = await getTableRows({
        code: 'eosio',
        scope: 'eosio',
        table: 'rexpool',
        limit: '1',
    });

    if (!rexPoolResponse || !rexPoolResponse.rows.length) {
        console.error('Failed to fetch rexpool');
        return;
    }

    const distConfigResponse = await getTableRows({
        code: 'exrsrv.tf',
        scope: 'exrsrv.tf',
        table: 'config',
        limit: '1',
    });

    if (!distConfigResponse || !distConfigResponse.rows.length) {
        console.error('Failed to fetch exrsrv.tf config');
        return;
    }

    const payoutsResponse = await getTableRows({
        code: 'exrsrv.tf',
        scope: 'exrsrv.tf',
        table: 'payouts',
        limit: '100',
    });

    if (!payoutsResponse || !payoutsResponse.rows.length) {
        console.error('Failed to fetch exrsrv.tf payouts');
        return;
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
        return '0';
    }

    const rexPayout = annualPayout.div(balanceRatio.plus(1));
    const stlosPayout = annualPayout.minus(rexPayout);

    const apy = stlosPayout.div(stlosTotal).times(100).toFixed(2);

    return apy;
}



export async function rexStaked(event, context) {
    const rex = await getRexStats();
    const totalLendable = parseFloat(rex.total_lendable);
    return respond(200, totalLendable);
}