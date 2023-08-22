const { generateKeyPairSync } = require('crypto');

// Generate a key pair
const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

// Output in JWK format
console.log({
  privateKey: privateKey.export({ format: 'jwk' }),
  publicKey: publicKey.export({ format: 'jwk' })
});