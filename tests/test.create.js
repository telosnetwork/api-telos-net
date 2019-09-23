const { Api, JsonRpc, RpcError } = require("eosjs");
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig"); // development only
const fetch = require("node-fetch"); // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require("util");


async function main() {
    const rpc = new JsonRpc('https://api.telos.kitchen', { fetch } );
    try {
        console.log(await rpc.get_account('teloskitchen'));
    } catch (e) {
        console.log("Account does not exist.");
    }
}

main();