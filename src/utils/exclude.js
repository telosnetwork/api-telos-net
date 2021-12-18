const {  getCurrencyBalance } = require("../libs/eosio-lib");

async function exclude(stats, exclusions){
    var supply = parseFloat(stats.supply);
    if (isNaN(supply)){
        throw new Error("Failed to get supply instead got stats with value of " + stats);
    }

    for (let i = 0; i < exclusions.length; i++) {
        let accountToCheck = exclusions[i];
        let balanceString = await getCurrencyBalance(accountToCheck);
        var bal = parseFloat(balanceString, 10);
        if (isNaN(bal)){
            throw new Error("Failed to get balance for " + accountToCheck + " instead got " + bal);
        }
        supply -= bal;
    }

    return supply
}

module.exports = { exclude };
