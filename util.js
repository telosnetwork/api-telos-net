import * as eosioLib from "./libs/eosio-lib";
import { success, failure } from './libs/response-lib';

export async function keygen(event, context) {
  // Sentry.init({ dsn: process.env.sentryDsn });

  try {
    let keys = [];
    keys.push(await eosioLib.genRandomKey());
    keys.push(await eosioLib.getRandomKey());
    
    return success({ message: `See attached keys`, keys: keys });
  } catch (e) {
    // Sentry.captureException(new Error(e));
    // await Sentry.flush();
    return failure({ message: e.message });
  }
}


export async function accountExists(event, context) {
  // Sentry.init({ dsn: process.env.sentryDsn });

  try {
    if (!event.queryStringParameters.accountName) {
      return failure({ message: "accountName query string parameters is required"});
    }

    const exists = await eosioLib.accountExists (event.queryStringParameters.accountName);
    
    return success({ accountName: event.queryStringParameters, exists: exists });
  } catch (e) {
    // Sentry.captureException(new Error(e));
    // await Sentry.flush();
    return failure({ message: e.message });
  }
}
  