import * as eosioLib from "./libs/eosio-lib";
import { respond } from './libs/response-lib';
import * as Sentry from '@sentry/node';
import * as sendLib from "./libs/send-lib";
import * as cryptoLib from "./libs/crypto-lib";
import * as dynamoDbLib from "./libs/dynamodb-lib";


export async function keygen(event, context) {
  Sentry.init({ dsn: process.env.sentryDsn });
  Sentry.configureScope(scope => scope.setExtra('Request Body', event.body));
  try {

    let numKeys = 2;
    if (event.queryStringParameters && event.queryStringParameters.numKeys) {
      numKeys = event.queryStringParameters.numKeys;
    }

    let keys = await eosioLib.genRandomKeys(numKeys);
    return respond(200, { message: `See attached keys`, keys: keys });
  } catch (e) {
    Sentry.captureException(e);
    await Sentry.flush(2500);
    return respond(500, { message: e.message });
  }
}


export async function accountExists(event, context) {
  Sentry.init({ dsn: process.env.sentryDsn });
  Sentry.configureScope(scope => scope.setExtra('Request Body', event.body));

  try {
    if (!event.queryStringParameters.accountName) {
      return respond(400, { message: "accountName query string parameters is required"});
    }

    const exists = await eosioLib.accountExists (event.queryStringParameters.accountName);
    
    return respond(200, { accountName: event.queryStringParameters.accountName, exists: exists });
  } catch (e) {
    Sentry.captureException(e);
    await Sentry.flush(2500);
    return respond(500, { message: e.message });
  }
}


export async function deleteRecord(event, context) {
  Sentry.init({ dsn: process.env.sentryDsn });
  Sentry.configureScope(scope => scope.setExtra('Request Body', event.body));

  try {
    const data = JSON.parse(event.body);

    if (!process.env.allowDeleteNumber || process.env.allowDeleteNumber !== "Y") {
      return respond(403, { message: "Deleting records is not allowed in this environment."});
    }

    if (!data.smsNumber) {
      return respond(400, { message: "smsNumber is required"});
    }
    const smsNumber = await sendLib.cleanNumberFormat(data.smsNumber);
    const smsHash = await cryptoLib.hash(smsNumber);
    await dynamoDbLib.deleteAccount (smsHash);

    return respond(200, { message: `Record matching ${data.smsNumber} has been removed.` });
  } catch (e) {
    Sentry.captureException(e);
    await Sentry.flush(2500);
    return respond(500, { message: e.message });
  }
}