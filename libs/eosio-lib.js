const { Api, JsonRpc, RpcError } = require("eosjs");
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig"); // development only
const fetch = require("node-fetch"); // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require("util");
import { getSecret } from "./auth-lib";

export async function create(accountName, ownerKey, activeKey) {

  const secret = await getSecret(process.env.tkOracleSecretKey);
  var secretStringObj = JSON.parse(secret.SecretString);
  const pk = secretStringObj[process.env.tkOracleSecretKey];

  const signatureProvider = new JsSignatureProvider([pk]);

  const rpc = new JsonRpc(process.env.eosioApiEndPoint, { fetch } );

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
  console.log("EOSLIB-CREATE::CREATE-- Actions: ", JSON.stringify(actions));
  const result = await api.transact({ actions: actions }, { blocksBehind: 3, expireSeconds: 30 });
  console.log("EOSLIB-CREATE::CREATE-- Result:", JSON.stringify(result));
  return result;
}