import { success, failure } from './libs/response-lib';
import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as sendLib from "./libs/send-lib";
import * as cryptoLib from "./libs/crypto-lib";

const CURRENT_VERSION = "v0.1";

export async function main(event, context) {
  const data = JSON.parse(event.body);

  if (!data.smsNumber) {
    return failure({ message: "smsNumber is required"});
  }

  try {
    const smsNumber = await sendLib.cleanNumberFormat(data.smsNumber);
    const smsHash = await cryptoLib.hash(smsNumber);
    let record = {};

    if (await dynamoDbLib.exists(smsHash)) {
      record = await dynamoDbLib.getBySmsHash (smsHash);
      if (record.accountCreatedAt > 0) {
        return failure({ message: `This SMS number ${smsNumber} has already received a free Telos account via this service. Use SQRL or another wallet to create another account.`});
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const msg = await sendLib.sendSMS(smsNumber, otp);

    record.smsHash = smsHash;
    record.smsOtp = otp;
    record.smsSid = msg.sid;
    record.version = CURRENT_VERSION;

    if (data.eosioAccount) { record.eosioAccount = data.eosioAccount; }
    if (data.activeKey) { record.activeKey = data.activeKey; }
    if (data.ownerKey) { record.ownerKey = data.ownerKey; }

    await dynamoDbLib.save(record);

    return success({ status: true, message: `SMS sent successfully - please locate your enrollment code there to proceed. SID: ${msg.sid}` });
  } catch (e) {
    return failure({ message: e.message });
  }
}
