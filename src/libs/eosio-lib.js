const { Api, JsonRpc, RpcError } = require("eosjs");
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig");
const fetch = require("node-fetch"); // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require("util");
const { getSecret } = require("./auth-lib");
const axios = require("axios");

async function create(accountName, ownerKey, activeKey) {

  const secret = await getSecret(process.env.accountCreatorKey);
  var secretStringObj = JSON.parse(secret.SecretString);
  const pk = secretStringObj[process.env.accountCreatorKey];

  const signatureProvider = new JsSignatureProvider([pk]);

  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder()
  });

  const actions = [
    {
      account: process.env.accountCreatorContract,
      name: "createconf",
      authorization: [
        {
          actor: process.env.accountCreatorAccount,
          permission: "active"
        }
      ],
      data: {
        account_creator: process.env.accountCreatorAccount,
        account_name: accountName,
        auth_creator: false,
        owner_key: ownerKey,
        active_key: activeKey
      }
    }
  ];
  const result = await api.transact({ actions: actions }, { blocksBehind: 3, expireSeconds: 30 });
  return result;
}

async function genRandomKey() {
  const ecc = require("eosjs-ecc");
  let key = {};
  key.privateKey = await ecc.randomKey();
  key.publicKey = await ecc.privateToPublic(key.privateKey);
  return key;
}

async function genRandomKeys(numKeys = 2) {
  let keys = [];
  for (var i = 0; i < numKeys; i++) {
    keys.push(await genRandomKey());
  }
  return keys;
}

async function generateRandomAccount(suggestedName = '') {
  let randomAccount = suggestedName;
  let accountTaken = false;
  if (checkAccountNameIntegrity(randomAccount)) {
    accountTaken = await accountExists(randomAccount);
    if (!accountTaken) return randomAccount;
  }
  do {
    randomAccount = getRandomAccountString();
    accountTaken = await accountExists(randomAccount);
  } while (accountTaken)
  return randomAccount;
}

async function accountExists(accountName) {
  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });
  try {
    await rpc.get_account(accountName);
    return true;
  } catch (e) {
    return false;
  }
}


function getRandomAccountString(){
  const validChars ='abcdefghijklmnopqrstuvwxyz12345';
  const accountNamelength = 12;
  let result = '';
  for ( let i = 0; i < accountNamelength; i++ ) {
    result += validChars.charAt(Math.floor(Math.random() * validChars.length));
  }
  return result;
}

function checkAccountNameIntegrity(accountName) {
  if (accountName.length < 12) {
    return false;
  }
  var telosAccountRegex = RegExp("^([a-z]|[1-5]){1,12}$", "g");
  if (!telosAccountRegex.test(accountName)) {
    return false;
  }
  return true;
}

function validAccountFormat(accountName) {
  var telosAccountRegex = RegExp("^([a-z]|[1-5]|[\.]){1,12}$", "g"); // does it match EOSIO account format?
  if (!telosAccountRegex.test(accountName)) {
    return false;
  }
  return true;
}

async function getCurrencyBalance(accountName, code = '', symbol = '') {
  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });
  try {
    if (code && symbol) {
      const queryParams = {  
        code,      
        scope: accountName,        
        table: 'accounts',        
        limit: 100
      }
      const tokenBalanceResponse = await rpc.get_table_rows(queryParams);
      for (row of tokenBalanceResponse.rows){
        const ticker = row.balance.split(" ")[1];
        if (ticker === symbol) return row.balance;
      }
      return '0'
    }
    let balanceResponse = await rpc.get_account(accountName);
    return balanceResponse.hasOwnProperty('core_liquid_balance') ?
      balanceResponse.core_liquid_balance.split(' ')[0] :
      '0';
  } catch (e) {
    return '0';
  }
}

async function getTableRows(opts) {
  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });
  return await rpc.get_table_rows(opts);
}

async function getCurrencyStats(code = "eosio.token", symbol = "TLOS") {
  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });
  let statRow = await rpc.get_table_rows({
    json: true,
    code: code,
    scope: symbol ? symbol.toUpperCase() : symbol,
    table: 'stat'
  });
  return statRow.rows[0];
}

async function getRexStats() {
  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });
  let rexRows = await rpc.get_table_rows({
    json: true,
    'code': 'eosio',
    'scope': 'eosio',
    'table': 'rexpool'
  });
  return rexRows.rows[0];
}

async function getCurrencyBurnt(code = "eosio.token", symbol = "TLOS") {
  let burnt = BigInt(0);
  const data = await axios(`${process.env.hyperionEndpoint}/v2/history/get_actions?account=${code}&symbol=${symbol}&filter=${code}:retire&sort=desc&simple=true`);
  for(action of data.data.simple_actions){
    if (action.data?.quantity){
      if(symbol.toLowerCase() !== action.data.quantity.split(' ')[1]?.toLowerCase()) continue;
      burnt = burnt + BigInt(action.data.quantity.split(' ')[0]); 
    }
  }
  return burnt.toString();
}

async function getActionStats(byHour, endMoment) {
  let params = {
    period: byHour ? '1h' : '24h'
  }

  if (endMoment)
    params.end_date = endMoment.toISOString();

  let actionsResult = await axios(`${process.env.hyperionEndpoint}/v2/stats/get_action_usage`, { params });
  
  return actionsResult.data;
}

module.exports = { create, genRandomKey, genRandomKeys, accountExists, generateRandomAccount, validAccountFormat, getCurrencyBalance, getCurrencyStats, getRexStats, getActionStats, getTableRows, getCurrencyBurnt }