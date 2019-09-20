import { success, failure } from './libs/response-lib';
import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as sendLib from "./libs/send-lib";
import * as cryptoLib from "./libs/crypto-lib";
import * as eosioLib from "./libs/eosio-lib";
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://4fb0b518dbf74512a27bf8bb24977136@sentry.io/1749694' });

export async function main(event, context) {

  console.log ("EVENT BODY : ", event.body);

  const data = JSON.parse(event.body);

  if (!data.smsNumber || !data.smsOtp) {
    return failure({ message: "smsNumber and smsOtp are required"});
  }

  console.log ("DATA: ", JSON.stringify(data));

  try {
    const smsNumber = await sendLib.cleanNumberFormat(data.smsNumber);
    const smsHash = await cryptoLib.hash(smsNumber);

    const accountRecord = await dynamoDbLib.getBySmsHash (smsHash);
    console.log("ACCOUNT RECORD: ", JSON.stringify(accountRecord));

    let result;
    if (data.smsOtp == accountRecord.smsOtp) {
      if (data.eosioAccount) { accountRecord.eosioAccount = data.eosioAccount; }
      if (data.activeKey) { accountRecord.activeKey = data.activeKey; }
      if (data.ownerKey) { accountRecord.ownerKey = data.ownerKey; }
      if (!accountRecord.eosioAccount || !accountRecord.activeKey || !accountRecord.ownerKey) {
        return failure({ message: `eosioAccount, activeKey, or ownerKey is not available. These attributes must be attached to the account record by passing these attributes to either the register or create service`});
      }
      result = await eosioLib.create (accountRecord.eosioAccount, accountRecord.ownerKey, accountRecord.activeKey);
    } else {
        return failure({ message: `The OTP provided does not match: ${data.smsOtp}. Permission denied.`});
    }
    console.log("RESULT: ", result);

    accountRecord.accountCreatedAt = Date.now();
    accountRecord.result = JSON.stringify(result);
    console.log("CREATE::MAIN:: Account record to save: ", JSON.stringify(accountRecord));
    await dynamoDbLib.save (accountRecord);

    return success({ message: `Telos account ${accountRecord.eosioAccount} created.`, result: result });
  } catch (e) {
    return failure({ message: e.message });
  }
}
