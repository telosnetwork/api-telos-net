const { Api, JsonRpc, RpcError } = require("eosjs");
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig");
const fetch = require("node-fetch"); // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require("util");
import { getSecret } from "./auth-lib";
import AWS from "aws-sdk";
import { request } from "https";
AWS.config.update({ region: "us-east-1" });

const tlosPerFaucet = '1000.0000 TLOS';
const rotationTableKey = 'rotation';

async function call(action, params) {
    const dynamoDb = new AWS.DynamoDB.DocumentClient();
    return dynamoDb[action](params).promise();
}

export async function getLastVoted() {
    const readParams = {
        TableName: process.env.testnetRotationTableName,
        Key: {
            tableKey: rotationTableKey
        }
    };

    const result = await call("get", readParams);
    if (!result.Item) {
        console.error("Failed to get rotation");
        return "[]";
    }

    return result.Item.rotationSchedule;
}

async function setLastVoted(rotationSchedule) {
    await call("put", {
        TableName: process.env.testnetRotationTableName,
        Item: {
            updatedAt: Date.now(),
            tableKey: rotationTableKey,
            rotationSchedule: rotationSchedule
        }
    });
}

export async function faucet(accountName) {
    console.log(`Faucet being called for ${accountName}`);
    const faucetAccount = process.env.testnetFaucetAccount;
    const actions = [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
            actor: faucetAccount,
            permission: 'active',
        }],
        data: {
            from: faucetAccount,
            to: accountName,
            quantity: tlosPerFaucet,
            memo: 'Testnet faucet'
        }
    }];
    console.log("TESTNET-FAUCET-- Actions: ", JSON.stringify(actions));
    const result = await faucetActions(actions);
    console.log("TESTNET-FAUCET-- Result:", JSON.stringify(result));
    return result;
}

export async function create(accountName, ownerKey, activeKey) {
    console.log(`Creating testnet account with name ${accountName} and keys ${ownerKey} ${activeKey}`);
    const faucetAccount = process.env.testnetFaucetAccount;

    const actions = [{
        account: 'eosio',
        name: 'newaccount',
        authorization: [{
            actor: faucetAccount,
            permission: 'active',
        }],
        data: {
            creator: faucetAccount,
            name: accountName,
            owner: {
                threshold: 1,
                keys: [{
                    key: ownerKey,
                    weight: 1
                }],
                accounts: [],
                waits: []
            },
            active: {
                threshold: 1,
                keys: [{
                    key: activeKey,
                    weight: 1
                }],
                accounts: [],
                waits: []
            },
        },
    }, {
        account: 'eosio',
        name: 'buyrambytes',
        authorization: [{
            actor: faucetAccount,
            permission: 'active',
        }],
        data: {
            payer: faucetAccount,
            receiver: accountName,
            bytes: 128000,
        },
    }, {
        account: 'eosio',
        name: 'delegatebw',
        authorization: [{
            actor: faucetAccount,
            permission: 'active',
        }],
        data: {
            from: faucetAccount,
            receiver: accountName,
            stake_net_quantity: '20.0000 TLOS',
            stake_cpu_quantity: '20.0000 TLOS',
            transfer: true,
        }
    },{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
            actor: faucetAccount,
            permission: 'active',
        }],
        data: {
            from: faucetAccount,
            to: accountName,
            quantity: tlosPerFaucet,
            memo: 'Testnet account creation'
        }
    }];
    console.log("TESTNET-CREATE::CREATE-- Actions: ", JSON.stringify(actions));
    const result = await faucetActions(actions);
    console.log("TESTNET-CREATE::CREATE-- Result:", JSON.stringify(result));
    return result;
}

export async function rotate(accountName) {
    let currentProducers = await getProducers();
    console.log(`Current producers: ${currentProducers}`);
    if (accountName && currentProducers.indexOf(accountName) < 0)
        return { success: false, message: `Cannot rotate ${accountName} in to the schedule, they are not an active producer` };

    let lastVotedString = await getLastVoted();
    let lastVoted = JSON.parse(lastVotedString);

    if (accountName && lastVoted.indexOf(accountName) < 21)
        return { success: false, message: `Cannot rotate ${accountName} in to the schedule, they are already active` };

    let mergedList = [];
    let newBps = [];
    // first find a list of new BPs
    for (let i = 0; i < currentProducers.length; i++) {
        if (lastVoted.indexOf(currentProducers[i]) == -1)
            newBps.push(currentProducers[i]);
    }

    console.log(`Found new BPs: ${newBps}`);
    let addedNew = false;
    // now lets see if any got kicked, build a new merged list that doesn't have them
    // and add newBps at position 21 if we get that far
    for (let i = 0; i < lastVoted.length; i++) {
        if (currentProducers.indexOf(lastVoted[i]) > -1)
            mergedList.push(lastVoted[i]);
        if (mergedList.length == 21) {
            mergedList = mergedList.concat(newBps);
            addedNew = true;
        }
    }

    // we didn't have 21 old ones, add new ones now
    if (!addedNew)
        mergedList = mergedList.concat(newBps);

    console.log(`Merged list: ${mergedList}`);
    lastVoted = mergedList;
    // if we're adding to the schedule and the requested account is outside of the 21, then add it here
    if (accountName && lastVoted.indexOf(accountName) > 20) {
        console.log(`adding ${accountName} to the schedule`);
        lastVoted.splice(20, 0, accountName);
    } else {
        // not adding a BP, just slide the array by 1
        for (let i = 0; i < 1; i++)
            lastVoted.splice(lastVoted.length - 1, 0, lastVoted.splice(0, 1)[0]);
    }

    lastVoted = organizeProducers(lastVoted);
    await voteProducers(lastVoted);
    console.log("Done with rotation");
    return { success: true };
}

function organizeProducers(producers) {
    return Array.from(new Set(producers));
}

async function getKeyBySecretName(secretName) {
    const secret = await getSecret(secretName);
    var secretStringObj = JSON.parse(secret.SecretString);
    return secretStringObj[secretName];
}

function getRPC() {
    return new JsonRpc(process.env.testnetApiEndPoint, { fetch });
}

function getApi(privateKey) {
    const signatureProvider = new JsSignatureProvider([privateKey]);
    const rpc = getRPC();

    return new Api({
        rpc,
        signatureProvider,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder()
    });
}

async function faucetActions(actions) {
    const pk = await getKeyBySecretName(process.env.testnetFaucetKey);
    const api = getApi(pk);
    return await api.transact({ actions: actions }, { blocksBehind: 3, expireSeconds: 30 });
}

async function voteProducers(producersArray) {
    await setLastVoted(JSON.stringify(producersArray));
    const eosApi = getApi(await getKeyBySecretName(process.env.testnetAutorotateKey));
    if (producersArray.length > 21)
        producersArray = producersArray.slice(0, 21);

    console.log(`voting: ${producersArray}`);
    await eosApi.transact({
        actions: [{
            account: 'eosio',
            name: 'voteproducer',
            authorization: [{
                actor: process.env.testnetAutorotateAccount,
                permission: 'active',
            }],
            data: {
                voter: process.env.testnetAutorotateAccount,
                proxy: '',
                producers: producersArray.sort()
            }
        }]
    }, {
        blocksBehind: 3,
        expireSeconds: 30,
    });
}

async function getProducers() {
    const jsonrpc = getRPC();
    const producers = [];
    await jsonrpc.get_producers(true, "", 10000).then(res => {
        for (let i = 0; i < res.rows.length; i++) {
            let thisRow = res.rows[i];
            if (thisRow.is_active != 1)
                continue;

            producers.push(thisRow.owner);
        }
    });
    return producers;
}