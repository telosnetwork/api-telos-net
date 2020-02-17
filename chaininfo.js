import { getCurrencyStats, getCurrencyBalance, getRexData } from "./libs/eosio-lib";
import { respond } from './libs/response-lib';

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
    return respond(200, supply);
}

export async function totalSupply(event, context) {
    const stats = await getCurrencyStats();
    console.log('total supply from stats: ' + stats.supply);
    return respond(200, parseFloat(stats.supply, 10));
}

export async function rexApr(event, context) {
    const rex = getRexStats();
    const totalLendable = parseFloat(rex.total_lendable);
    return ((12000000 / total_lendable) * 100).toFixed(2);
}