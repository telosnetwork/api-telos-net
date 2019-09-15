import { success, failure } from './libs/response-lib';
import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as sendLib from "./libs/send-lib";

const CURRENT_VERSION = "v0.1";

async function hash (data) {
    var crypto = require('crypto');
    var shasum = crypto.createHash('sha256');
    shasum.update(data);
    return shasum.digest('hex');
}

export async function main(event, context) {
  const data = JSON.parse(event.body);

  if (!data.smsNumber || !data.eosioAccount) {
    return failure({ message: "smsNumber and eosioAccount are required"});
  }

  try {
    const smsNumber = await sendLib.cleanNumberFormat(data.smsNumber);
    const smsHash = await hash(smsNumber);

    if (await dynamoDbLib.exists(smsHash)) {
        return failure({ message: `This SMS number ${smsNumber} has already received their Telos account. Use SQRL or another wallet to create another account.`});
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const msg = await sendLib.sendSMS(smsNumber, otp);

    const record = {};
    record.smsHash = smsHash;
    record.eosioAccount = data.eosioAccount;
    record.smsOtp = otp;
    record.smsSid = msg.sid;
    record.version = CURRENT_VERSION;

    await dynamoDbLib.save(record);

    return success({ status: true, message: `SMS sent successfully - please locate your enrollment code there to proceed. SID: ${msg.sid}` });
  } catch (e) {
    return failure({ message: e.message });
  }
}
