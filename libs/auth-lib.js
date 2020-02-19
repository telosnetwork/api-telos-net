async function getSecret(secret) {
  const AWS = require("aws-sdk");
  var secretsmanager = new AWS.SecretsManager({ region: "us-east-1" });

  var params = {
    SecretId: secret
  };

  // The data JSON returned contains the SecretString
  // exports.handler = async (context) => {
  return await secretsmanager
    .getSecretValue(params)
    .promise()
    .then(data => {
      return data;
    })
    .catch(error => {
      return error;
    });
}

async function authenticate(confirmAuthSecretName, confirmAuthSecret) {
  if (!confirmAuthSecretName || !confirmAuthSecret) {
    throw new Error(
      "Access denied. confirmAuthSecretName and confirmAuthSecret are both required."
    );
  }
  const secret = await getSecret(confirmAuthSecretName);
  var secretStringObj = JSON.parse(secret.SecretString);

  if (secretStringObj[confirmAuthSecretName] !== confirmAuthSecret) {
    throw new Error(
      "Access denied. Invalid confirmAuthSecretName or confirmAuthSecret."
    );
  }
}

module.exports = { getSecret, authenticate }