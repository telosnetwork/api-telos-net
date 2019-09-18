const { Api, JsonRpc, RpcError } = require("eosjs");
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig"); // development only
const fetch = require("node-fetch"); // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require("util");
import { getSecret } from "./auth-lib";

export async function create(accountName, ownerKey, activeKey) {

  console.log("ENDPOINT: ", process.env.eosioApiEndPoint);
  console.log ("SECRET KEY: ", tkOracleSecretKey);
  const secret = await getSecret(process.env.tkOracleSecretKey);
  console.log ("SECRET: ", secret);
  var secretStringObj = JSON.parse(secret.SecretString);
  const pk = secretStringObj[process.env.tkOracleSecretKey];
  console.log(" pk: ", pk);

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
      account: process.env.tkAccountCreator,
      name: "create",
      authorization: [
        {
          actor: process.env.tkOracle,
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
  console.log("Actions: ", JSON.stringify(actions));
  await api
    .transact(
      {
        actions: actions
      },
      {
        blocksBehind: 3,
        expireSeconds: 30
      }
    ).then(function(result) {
      console.log()
      console.log(JSON.stringify(result));
      return result;
    })
    .catch(function(e) {
      console.log ("ERROR CATCH");
      console.log(JSON.stringify(e));
      console.log(e.toString());
      throw new Error("Error submitting transaction to EOSIO:" + e.toString());
    });
}