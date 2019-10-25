import { getCurrencyBalance, getCurrencyStats } from '../libs/eosio-lib.js'

const cmcSupplyExclusions = ["exrsrv.tf", "tf", "eosio.saving", "free.tf", "eosio.names", 
    "econdevfunds", "eosio.ram", "ramadmin.tf", "ramlaunch.tf", "treasury.tf", "accounts.tf", "grants.tf"];


test('eosio', async () =>  {
    const stats = await getCurrencyStats();
    var supply = parseFloat(stats.supply);
    await getCurrencyBalance('eosio');
    for (let i = 0; i < cmcSupplyExclusions.length; i++) {
        let accountToCheck = cmcSupplyExclusions[i];
        console.log("Checking balance for " + accountToCheck);
        let balanceString = await getCurrencyBalance(accountToCheck);
        console.log(balanceString);
        var bal = parseFloat(balanceString, 10);
        if (isNaN(bal))
            continue;

        supply -= bal;
    }
    
    console.log('supply: ' + supply + ' was ' + stats.supply);

})