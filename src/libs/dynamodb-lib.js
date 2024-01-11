const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const { dayElapsed } = require("../utils/dayElapsed");

const FAUCET_TABLE = process.env.testnetFaucetTableName;
const NO_ACCOUNT = 'create account'

function call(action, params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  return dynamoDb[action](params).promise();
}

async function save(record) {
  record.updatedAt = Date.now();

  await call("put", {
    TableName: process.env.tableName,
    Item: record
  });
}

async function deleteAccount(smsHash) {
  const delParams = {
    TableName: process.env.tableName,
    Key: {
      smsHash: smsHash
    }
  };

  await call("delete", delParams);
}

async function getMarketdata(tokens) {
  let results = [];
  for(let i in tokens){
    let token = tokens[i];
    token.symbol = token.symbol.toUpperCase().replace('WTLOS', 'TLOS').replace('WBTC', 'BTC');
    const expr = 'symbol = :token'
    let values = {};
    const params = {
      TableName: process.env.marketdataTableName,
      ExpressionAttributeValues: {
        ':token':  token.symbol,
      },
      KeyConditionExpression: expr,
      ScanIndexForward: false,
      Limit: 1
    }
    const result = await call("query", params);
    console.log(result);
    if(result.Items?.length > 0) {
      results.push(result.Items[0]);
    }
  };
  console.log(results);
  return results;
}

async function ipCanCreate(ipAddress) {
  const readParams = {
    TableName: process.env.recaptchaTableName,
    Key: {
      ipAddress
    }
  }

  const result = await call("get", readParams);

  if(result.Item) {
    min = 1000*60
    difference = ((Date.now() - result.Item.firstCreate)/min)
    difference = difference ? difference : 0
  }

  if (!result.Item || !result.Item.firstCreate || result.Item.accountsCreated < result.Item.accountsAllowed || difference > process.env.TIME_SPAN) {
    return true;
  }

  return false;
}

async function ipCanTransact(ipAddress, accountName = NO_ACCOUNT) {

  const ipParams = {
    TableName: FAUCET_TABLE,
    Key: {
      IpAddress: ipAddress
    }
  }

  const result = await call("get", ipParams);

  if(result.Item) {
    if (!dayElapsed(result.Item.LastActionTime)){
      await updateAttemptCount(ipAddress, result.Item.AttemptCount);
      return false;
    }
  }else if(accountName !== NO_ACCOUNT){

    const accountParams = {
      TableName: FAUCET_TABLE,
      IndexName: `${process.env.testnetFaucetSecondaryIndex}-index`,
      KeyConditionExpression: `${process.env.testnetFaucetSecondaryIndex} = :account_name`,
      ExpressionAttributeValues:  { ':account_name' : accountName }
    }

    const result = await call("query", accountParams);

    if(result.Items.length) {
      const item = result.Items[0];
      if (!dayElapsed(item.LastActionTime)){
        await updateAttemptCount(item.IpAddress, item.AttemptCount)
        return false;
      }
    }
  }
  await addFaucetItem(ipAddress, accountName)
  return true;
}

async function updateAttemptCount(ipAddress, currentCount){
  await call("update", {
    TableName: FAUCET_TABLE,
    Key: {
      IpAddress: ipAddress
    },
    UpdateExpression: "set AttemptCount = AttemptCount + :num",
    ExpressionAttributeValues: {
      ":num": 1,
    }
  });
}

async function addFaucetItem(ipAddress, accountName){
  await call("put", {
    TableName: FAUCET_TABLE,
    Item: {
      IpAddress: ipAddress, 
      AttemptCount: 1, 
      AccountName: accountName, 
      LastActionTime: Date.now()
    }
  })
}

async function ipCreated(ipAddress) {
  const readParams = {
    TableName: process.env.recaptchaTableName,
    Key: {
      ipAddress
    }
  }

  const lastCreate = Date.now();
  const firstCreate = lastCreate;
  const accountsCreated = 1;
  const accountsAllowed = 4;

  const result = await call("get", readParams);

  difference = 0;
  if(result.Item){
    min = 1000*60
    difference = ((Date.now() - result.Item.firstCreate)/min)
    difference = difference ? difference : 0 // Get time since first create in minutes
  }
  
  if (!result.Item) { // If user has never created an account through this service
    const createResult = await call("put", {
      TableName: process.env.recaptchaTableName,
      Item: {
        ipAddress, accountsCreated, accountsAllowed, lastCreate, firstCreate
      },
      ConditionExpression: 'attribute_not_exists(ipAddress)'
    })
    
  } else if(!result.Item.firstCreate){ // If a user has not created an account since we added support for creating 4 accounts/week
    const updateResult = await call("update", {
      TableName: process.env.recaptchaTableName,
      Key: {
        ipAddress
      },
      UpdateExpression: "set accountsCreated = :num, accountsAllowed = :accountsAllowed, lastCreate = :lastCreate, firstCreate = :firstCreate",
      ExpressionAttributeValues: {
        ":accountsAllowed": accountsAllowed,
        ":num": 1,
        ":lastCreate": lastCreate,
        ":firstCreate": firstCreate
      }
    })
  } else if(difference > process.env.TIME_SPAN) { // If it has been at least 7 days since their first account this set
    const updateResult = await call("update", {
      TableName: process.env.recaptchaTableName,
      Key: {
        ipAddress
      },
      UpdateExpression: "set accountsCreated = accountsCreated + :num, accountsAllowed = accountsCreated + :accountsAllowed, lastCreate = :lastCreate, firstCreate = :lastCreate",
      ExpressionAttributeValues: {
        ":num": 1,
        ":lastCreate": lastCreate,
        ":accountsAllowed": accountsAllowed
      }
    })
  } else {
    const updateResult = await call("update", {
      TableName: process.env.recaptchaTableName,
      Key: {
        ipAddress
      },
      UpdateExpression: "set accountsCreated = accountsCreated + :num, lastCreate = :lastCreate",
      ConditionExpression: "accountsCreated < accountsAllowed",
      ExpressionAttributeValues: {
        ":num": 1,
        ":lastCreate": lastCreate
      }
    })
  }
}

async function exists(smsHash) {
  const readParams = {
    TableName: process.env.tableName,
    Key: {
      smsHash: smsHash
    }
  };

  const result = await call("get", readParams);
  if (!result.Item) {
    return false;
  }

  return true;
}

async function getBySmsHash(smsHash) {
  const readParams = {
    TableName: process.env.tableName,
    Key: {
      smsHash: smsHash
    }
  };

  const result = await call("get", readParams);
  if (!result.Item) {
    throw new Error(`SMS Hash ${smsHash} not found`);
  }

  return result.Item;
}


async function getAccountNameForGoogleUser(userId) {
  const params = {
    TableName: process.env.googleUsersTableName,
    Key: {
      userId: userId
    }
  };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item ? result.Item.accountName : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}


async function registerAccountNameForGoogleUser(userId, accountName) {
  const params = {
    TableName: process.env.googleUsersTableName,
    Item: {
      userId: userId,
      accountName: accountName
    }
  };

  try {
    await dynamoDb.put(params).promise();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}


module.exports = {
  call,
  save,
  deleteAccount,
  exists,
  getBySmsHash,
  ipCanCreate,
  ipCanTransact,
  ipCreated,
  getMarketdata,
  getAccountNameForGoogleUser,
  registerAccountNameForGoogleUser
}