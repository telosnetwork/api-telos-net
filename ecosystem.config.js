const envDev = {
  NODE_ENV: 'development',
  accountCreatorAccount: 'accounts.tf',
  accountCreatorContract: 'accounts.tf',
  accountCreatorKey: 'tf-account-creator-key-dev',
  allowDeleteNumber: 'Y',
  eosioApiEndPoint: 'https://testnet.telos.caleos.io',
  sentryDsn: 'https://4fb0b518dbf74512a27bf8bb24977136@sentry.io/1749694',
  testnetApiEndPoint: 'https://testnet.telos.caleos.io',
  testnetAutorotateAccount: 'autorotate',
  testnetAutorotateKey: 'testnet-autorotate-key',
  testnetFaucetAccount: 'faucet.tf',
  testnetFaucetKey: 'testnet-faucet-key',
  twilioAccountSid: 'tf-twilio-sid',
  twilioAuthToken: 'tf-twilio-auth',
  twilioSmsNumber: '+18178356742',
  tableName: 'dev-accounts',
  testnetRotationTableName: 'dev-testnet-rotation',
  testnetFaucetTableName: 'dev-testnet-faucet',
  API_LOG_LEVEL: 'debug',
  MODE: 'dev',
  SERVER_HOSTNAME: 'api-dev.telos.net',
  SERVER_PORT: 3000
}

const envProd = Object.assign({}, envDev, {
  NODE_ENV: 'production',
  accountCreatorKey: 'tf-account-creator-key',
  allowDeleteNumber: 'N',
  eosioApiEndPoint: 'https://telos.caleos.io',
  tableName: 'prod-accounts',
  testnetRotationTableName: 'prod-testnet-rotation',
  testnetFaucetTableName: 'prod-testnet-faucet',
  API_LOG_LEVEL: 'debug',
  MODE: 'prod',
  SERVER_HOSTNAME: 'api-dev.telos.net',
  SERVER_PORT: 4000
}
})

const dev = {
  name: 'api-dev',
  script: 'src/app.js',
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '1G',
  env: envDev
}

const prod = {
  name: 'api-prod',
  script: 'src/app.js',
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '1G',
  env: envProd
}

module.exports = {
  apps: [dev, prod]
};
