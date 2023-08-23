const { getKeyBySecretName } = require("./auth-lib");
const { createPrivateKey, randomUUID } = require('crypto');
const { promisify } = require('util');
const jsonwebtoken = require('jsonwebtoken');
const { ethers } = require('ethers');

// Note: must have aws cli configured locally to execute

// See https://docs.topperpay.com/intro/ for documentation 

// Promisify the `jsonwebtoken.sign()` method for simplicity.
const sign = promisify(jsonwebtoken.sign);

function getPayload(address, sandbox){
  if (address) {
    try{
      address = ethers.utils.getAddress(address);
    }catch(e){
      address = null;
      console.error("Invalid address supplied, update address in form.")
    }
  }
  // Create the payload for the bootstrap token, note that the
  // `jsonwebtoken.sign()` method automatically adds the `iat` claim.
  const payload = {
    jti: randomUUID(),
    sub: sandbox ? 'e46b1cb7-9fb5-4e1d-985b-fca1b4e6f217' : '13ebd307-7d82-4f67-aee1-f20202bc7651',
    source: {
      amount: '50.00',
      asset: 'USD'
    },
    target: address ? {
      address,
      asset: 'TLOS',
      network: 'ethereum',
      label: 'Ethereum Mainnet Address',
      recipientEditMode: 'only-address-and-tag'
    } :
    {
      asset: 'TLOS',
      network: 'ethereum',
      label: 'Ethereum Mainnet Address',
      recipientEditMode: 'only-address-and-tag'
    }
  };

  return payload;
}

async function fetchPrivateKey(sandbox){
  const secretName = sandbox ? 'topper-widget-key' : 'topper-widget-key-production';

  // fetch private key from AWS, required to generate bootstrap token
  const topperWidgetKey = await getKeyBySecretName(secretName);

  // Load private key in JWK format from an AWS secret.
  const privateKeyJwk = JSON.parse(topperWidgetKey);

  // Parse the JWK formatted key.
  const privateKey = createPrivateKey({ format: 'jwk', key: privateKeyJwk });

  return privateKey;
}

// Create the options the `jsonwebtoken.sign()` method.
function getOptions(sandbox){
  const options = {
    algorithm: 'ES256',
    keyid: sandbox ? '87c793b4-8ba5-4dba-a17d-8e49144d8766' : 'a393c622-339e-4b3b-bd59-3a18ef4d9f2c' 
  };
  return options;
}

async function getBootstrapToken(ethAddress, sandbox) {
  const payload = getPayload(ethAddress, sandbox);
  const privateKey = await fetchPrivateKey(sandbox);
  const options = getOptions(sandbox);
  const bootstrapToken = await sign(payload, privateKey, options);

  return bootstrapToken;
}

module.exports = { getBootstrapToken };