const { Api, JsonRpc, RpcError } = require("eosjs");
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig"); // development only
const fetch = require("node-fetch"); // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require("util");


async function main() {
    const pk = "";
    const signatureProvider = new JsSignatureProvider([pk]);

    const rpc = new JsonRpc("https://test.telos.kitchen", { fetch });

    const api = new Api({
        rpc,
        signatureProvider,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder()
    });

    const actions = [
        {
            account: "tksmscreator",
            name: "create",
            authorization: [
                {
                    actor: "tksmsoracles",
                    permission: "active"
                }
            ],
            data: {
                account_to_create: "newte3osacct",
                owner_key: "EOS6YK2nm32KPtojJ8YziNMhU3Tmk3wt3czXTbehtrUyEiyUvub4Y",
                active_key: "EOS6YK2nm32KPtojJ8YziNMhU3Tmk3wt3czXTbehtrUyEiyUvub4Y"
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
        ).then(function (result) {
            console.log()
            console.log(JSON.stringify(result));
            return result;
        })
        .catch(function (e) {
            console.log("ERROR CATCH");
            console.log(JSON.stringify(e));
            console.log(e.toString());
            throw new Error("Error submitting transaction to EOSIO:" + e.toString());
        });

}

main();