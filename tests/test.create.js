const { Api, JsonRpc, RpcError } = require("eosjs");
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig"); // development only
const fetch = require("node-fetch"); // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require("util");

const ecc = require('eosjs-ecc');

async function getKey () {
    let key = {};
    key.privateKey = await ecc.randomKey();
    key.publicKey = await ecc.privateToPublic(key.privateKey);
    return key;
    // ecc.randomKey().then(privateKey => {
    //   key.privateKey = privateKey;
    //   key.publicKey = ecc.privateToPublic(privateKey);
    //   console.log (key);
    //   return key;
    // });
}

async function genKeys (numKeys = 2) {
    let keys = [];
    for (var i=0; i < numKeys; i++) {
      keys.push (await getKey());
    }
    return keys;
  }

async function main() {

    const keys = await genKeys(5);
    console.log("keys: ", keys);


  
}

main();