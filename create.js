import { success, failure } from './libs/response-lib';
import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as sendLib from "./libs/send-lib";
import * as cryptoLib from "./libs/crypto-lib";
import * as eosioLib from "./libs/eosio-lib";

export async function main(event, context) {
  const data = JSON.parse(event.body);

  if (!data.smsNumber || !data.smsOtp || !data.ownerKey || !data.activeKey) {
    return failure({ message: "smsNumber, smsOtp, ownerKey and activeKey are required"});
  }

  try {
    const smsNumber = await sendLib.cleanNumberFormat(data.smsNumber);
    const smsHash = await cryptoLib.hash(smsNumber);

    const accountRecord = await dynamoDbLib.getBySmsHash (smsHash);

    let result;
    if (data.smsOtp == accountRecord.smsOtp) {
        result = await eosioLib.create (accountRecord, data.ownerKey, data.activeKey);
    } else {
        return failure({ message: `The OTP provided does not match: ${data.smsOtp}. Permission denied.`});
    }

    accountRecord.accountCreatedAt = Date.now();
    accountRecord.result = result;
    await dynamoDbLib.save (accountRecord);

    return success({ message: `Account created.`, result: result });
  } catch (e) {
    return failure({ message: e.message });
  }
}
