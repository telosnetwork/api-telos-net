import { getCurrencyStats, getCurrencyBalance, getRexStats } from "./libs/eosio-lib";
import { respond } from './libs/response-lib';
import { exclude } from "./src/utils/exclude";

const cmcCirculationExclusions = ["exrsrv.tf", "tlosrecovery", "treasury.tcd", "works.decide", "tf", "eosio.saving", "free.tf", "eosio.names",
    "econdevfunds", "eosio.ram", "ramadmin.tf", "ramlaunch.tf", "treasury.tf", "accounts.tf", "grants.tf", "tedp4holding"];

const standardCirculationExclusions = ["exrsrv.tf", "tlosrecovery", "tedp4holding"];

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

export async function rexStaked(event, context) {
    const rex = await getRexStats();
    const totalLendable = parseFloat(rex.total_lendable);
    return respond(200, totalLendable);
}
