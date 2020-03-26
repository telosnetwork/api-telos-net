const { Api, JsonRpc, RpcError } = require("eosjs");
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig");
const fetch = require("node-fetch"); // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require("util");
import { getSecret } from "./auth-lib";
import { generateKeyPair } from "crypto";

export async function create(accountName, ownerKey, activeKey) {

  const secret = await getSecret(process.env.accountCreatorKey);
  var secretStringObj = JSON.parse(secret.SecretString);
  const pk = secretStringObj[process.env.accountCreatorKey];

  const signatureProvider = new JsSignatureProvider([pk]);
  console.log(process.env.eosioApiEndPoint);

  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder()
  });

  const actions = [
    {
      account: process.env.accountCreatorAccount,
      name: "create",
      authorization: [
        {
          actor: process.env.accountCreatorContract,
          permission: "active"
        }
      ],
      data: {
        account_to_create: accountName,
        owner_key: ownerKey,
        active_key: activeKey
      }
    }
  ];
  console.log("EOSLIB-CREATE::CREATE-- Actions: ", JSON.stringify(actions));
  const result = await api.transact({ actions: actions }, { blocksBehind: 3, expireSeconds: 30 });
  console.log("EOSLIB-CREATE::CREATE-- Result:", JSON.stringify(result));
  return result;
}

export async function genRandomKey() {
  const ecc = require("eosjs-ecc");
  let key = {};
  key.privateKey = await ecc.randomKey();
  key.publicKey = await ecc.privateToPublic(key.privateKey);
  return key;
}

export async function genRandomKeys(numKeys = 2) {
  let keys = [];
  for (var i = 0; i < numKeys; i++) {
    keys.push(await genRandomKey());
  }
  return keys;
}

export async function accountExists(accountName) {
  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });
  try {
    await rpc.get_account(accountName);
    return true;
  } catch (e) {
    return false;
  }
}

export async function validAccountFormat(accountName) {
  var telosAccountRegex = RegExp("^([a-z]|[1-5]|[\.]){1,12}$", "g"); // does it match EOSIO account format?
  if (!telosAccountRegex.test(accountName)) {
    return false;
  }
  return true;
}

export async function getCurrencyBalance(accountName, code = "eosio.token", symbol = "1.0000 TLOS") {
  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });
  try {
    let balanceResponse = await rpc.get_account(accountName);
    return balanceResponse.hasOwnProperty('core_liquid_balance') ?
      balanceResponse.core_liquid_balance.split(' ')[0] :
      '0';
  } catch (e) {
    return '0';
  }
}

export async function getCurrencyStats(code = "eosio.token", symbol = "1.0000 TLOS") {
  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });
  let symbolName = symbol.split(" ")[1];
  let statRow = await rpc.get_table_rows({
    json: true,
    code: code,
    scope: symbolName,
    table: 'stat'
  });
  return statRow.rows[0];
}

export async function getRexStats() {
  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch });
  let rexRows = await rpc.get_table_rows({
    json: true,
    'code': 'eosio',
    'scope': 'eosio',
    'table': 'rexpool'
  });
  return rexRows.rows[0];
}

