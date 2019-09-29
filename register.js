import { respond } from './libs/response-lib';
import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as sendLib from "./libs/send-lib";
import * as cryptoLib from "./libs/crypto-lib";
import * as Sentry from '@sentry/node'
import { VoipError } from './libs/voip-error';
import * as eosioLib from "./libs/eosio-lib";

const CURRENT_VERSION = "v0.1";

export async function main(event, context) {
  Sentry.init({ dsn: process.env.sentryDsn });
  Sentry.configureScope(scope => scope.setExtra('Request Body', event.body));

  const data = JSON.parse(event.body);

  if (!data.smsNumber) {
    return respond(400, { message: "smsNumber is required"});
  }

  try {
    const smsNumber = await sendLib.cleanNumberFormat(data.smsNumber);
    const smsHash = await cryptoLib.hash(smsNumber);
    let record = {};

    if (await dynamoDbLib.exists(smsHash)) {
      record = await dynamoDbLib.getBySmsHash (smsHash);
      if (record.accountCreatedAt > 0) {
        return respond(403, { message: `This SMS number ${smsNumber} has already received a free Telos account via this service. Use SQRL or another wallet to create another account.`});
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const msg = await sendLib.sendSMS(smsNumber, otp);

    record.smsHash = smsHash;
    record.smsOtp = otp;
    record.smsSid = msg.sid;
    record.version = CURRENT_VERSION;

    if (data.telosAccount) { 
      if (!await eosioLib.validAccountFormat(data.telosAccount)) {
        return respond(400, { message: `Requested Telos account name (${data.telosAccount} is not a valid format. It must match ^([a-z]|[1-5]|[\.]){1,12}$`});
      }
      if (!await eosioLib.accountExists(data.telosAccount)) {
        return respond(400, { message: `Requested Telos account name (${data.telosAccount} already exists.`});
      }
      record.telosAccount = data.telosAccount; 
    }
    
    if (data.activeKey) { record.activeKey = data.activeKey; }
    if (data.ownerKey) { record.ownerKey = data.ownerKey; }

    await dynamoDbLib.save(record);

    return respond(200, { message: `SMS sent successfully - please locate your enrollment code there to proceed. SID: ${msg.sid}` });
  } catch (e) {
    Sentry.captureException(e);
    await Sentry.flush(2500);
    if (e instanceof VoipError || e.name === 'VoipError'){
      return respond(401, { message: e.message });
    }
    return respond(500, { message: e.message });
  }
}
