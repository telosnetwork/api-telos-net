import { getCurrencyStats, getCurrencyBalance } from "./libs/eosio-lib";
import { respond } from './libs/response-lib';
import { getLastVoted, rotate, create, faucet } from "./libs/testnet-lib";

export async function pourFaucet(event, context) {
    if (!event.pathParameters || !event.pathParameters.accountName)
        return respond(400, { message: "Please specify an account to recevie from the faucet" });

    try {
        let result = await faucet(event.pathParameters.accountName);
        return respond(200, { success: true, result: result, transactionId: result.transaction_id });
    } catch (e) {
        return respond(400, { success: false, message: e.message });
    }
}

export async function account(event, context) {
    const data = JSON.parse(event.body);
    if (!data.ownerKey || !data.activeKey || !data.accountName)
        return respond(400, { success: false, message: "Please provide ownerKey, activeKey and accountName in the post body" });

    try {
        let result = await create(data.accountName, data.ownerKey, data.activeKey);
        return respond(200, { success: true, result: result, transactionId: result.transaction_id  });
    } catch (e) {
        return respond(400, { success: false, message: e.message });
    }
}

export async function addToRotation(event, context) {
    if (!event.pathParameters || !event.pathParameters.bpAccount)
        return respond(400, { success: false, message: "Please specify a BP account to add to the schedule" });

    let rotationResult = await rotate(event.pathParameters.bpAccount);
    if (rotationResult.success)
        return respond(200, { success: true, message: `Successfully rotated ${event.pathParameters.bpAccount} into the testnet schedule` });
    else
        return respond(400, { success: false, message: rotationResult.message });
}

export async function autorotate(event, context) {
    return respond(200, await rotate());
}

export async function getRotationSchedule(event, context) {
    return respond(200, { success: true, schedule: JSON.parse(await getLastVoted()) });
}