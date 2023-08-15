const { getKeyBySecretName } = require("./auth-lib");
const { createPrivateKey, randomUUID } = require('crypto');
const { promisify } = require('util');
const jsonwebtoken = require('jsonwebtoken');

// Promisify the `jsonwebtoken.sign()` method for simplicity.
const sign = promisify(jsonwebtoken.sign);

function getPayload(address){
  // Create the payload for the bootstrap token, note that the
  // `jsonwebtoken.sign()` method automatically adds the `iat` claim.
  const payload = {
    jti: randomUUID(),
    sub: 'e46b1cb7-9fb5-4e1d-985b-fca1b4e6f217',
    source: {
      amount: '100.00',
      asset: 'USD'
    },
    target: {
      address: '0xb794f5ea0ba39494ce839613fffba74279579268',
      asset: 'TLOS',
      network: 'ethereum',
      label: 'My wallet'
    }
  };
}


async function fetchPrivateKey(){
  // Load private key in JWK format from an environment variable.
  const privateKeyJwk = JSON.parse(await getKeyBySecretName('topper-widget-key'));

  // Parse the JWK formatted key.
  const privateKey = createPrivateKey({ format: 'jwk', key: privateKeyJwk });
  return privateKey;
}

// Create the options the `jsonwebtoken.sign()` method.
const options = {
  algorithm: 'ES256',
  keyid: '87c793b4-8ba5-4dba-a17d-8e49144d8766'
};


async function getBootstrapToken(ethAddress) {
  const privateKey = await fetchPrivateKey();
  const bootstrapToken = await sign(payload, privateKey, options);
  return bootstrapToken;
}

module.exports = { getBootstrapToken };