const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

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

async function ipCanCreate(ipAddress) {
  const readParams = {
    TableName: process.env.recaptchaTableName,
    Key: {
      ipAddress
    }
  }

  const result = await call("get", readParams);
  if (!result.Item || result.Item.accountsCreated < result.Item.accountsAllowed) {
    return true;
  }

  return false;
}

async function ipCreated(ipAddress) {
  const readParams = {
    TableName: process.env.recaptchaTableName,
    Key: {
      ipAddress
    }
  }

  const lastCreate = Date.now();
  const result = await call("get", readParams);

  if (!result.Item) {
    const accountsCreated = 1;
    const accountsAllowed = 1;
    const createResult = await call("put", {
      TableName: process.env.recaptchaTableName,
      Item: {
        ipAddress, accountsCreated, accountsAllowed, lastCreate
      },
      ConditionExpression: 'attribute_not_exists(ipAddress)'
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

module.exports = { call, save, deleteAccount, exists, getBySmsHash, ipCanCreate, ipCreated }