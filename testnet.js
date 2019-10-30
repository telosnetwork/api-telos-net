import { getCurrencyStats, getCurrencyBalance } from "./libs/eosio-lib";
import { respond } from './libs/response-lib';
import { getLastVoted, rotate } from "./libs/testnet-lib";

export async function faucet(event, context) {

}

export async function account(event, context) {

}

export async function addToRotation(event, context) {
    if (!event.pathParameters || !event.pathParameters.bpAccount)
        return respond(400, { message: "Please specify a BP account to add to the schedule"});

    let rotationResult = await rotate(event.pathParameters.bpAccount);
    if (rotationResult.success)
        return respond(200, {message: `Successfully rotated ${event.pathParameters.bpAccount} into the testnet schedule`});
    else
        return respond(400, {message: rotationResult.message});
}

export async function autorotate(event, context) {
    return respond(200, await rotate());
}

export async function getRotationSchedule(event, context) {
    return respond(200, {schedule: JSON.parse(await getLastVoted())});
}