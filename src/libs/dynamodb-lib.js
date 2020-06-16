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

module.exports = { call, save, deleteAccount, exists, getBySmsHash }