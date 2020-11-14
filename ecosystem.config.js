const envDev = {
  NODE_ENV: 'development',
  tableName: 'dev-accounts',
  testnetRotationTableName: 'dev-testnet-rotation',
  testnetFaucetTableName: 'dev-testnet-faucet',
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
  API_LOG_LEVEL: 'debug',
  MODE: 'dev',
  SERVER_ENDPOINT: 'api-dev.telos.net',
  SERVER_PORT: 3000,
  recaptchaClientKey: '6Ld-_eIZAAAAAF6JsrFudo_uQjRL4eqPAZE40I3o',
  recaptchaServerkey: '6Ld-_eIZAAAAAHNKjH47BPSMdVltMNpSosc0hr0a',
  recaptchaTableName: 'dev-recaptcha-accounts'
}

const envProd = {
  NODE_ENV: 'production',
  tableName: 'prod-accounts',
  testnetRotationTableName: 'prod-testnet-rotation',
  testnetFaucetTableName: 'prod-testnet-faucet',
  accountCreatorAccount: 'accounts.tf',
  accountCreatorContract: 'accounts.tf',
  accountCreatorKey: 'tf-account-creator-key-prod',
  allowDeleteNumber: 'N',
  eosioApiEndPoint: 'https://telos.caleos.io',
  sentryDsn: 'https://4fb0b518dbf74512a27bf8bb24977136@sentry.io/1749694',
  testnetApiEndPoint: 'https://testnet.telos.caleos.io',
  testnetAutorotateAccount: 'autorotate',
  testnetAutorotateKey: 'testnet-autorotate-key',
  testnetFaucetAccount: 'faucet.tf',
  testnetFaucetKey: 'testnet-faucet-key',
  twilioAccountSid: 'tf-twilio-sid',
  twilioAuthToken: 'tf-twilio-auth',
  twilioSmsNumber: '+18178356742',
  API_LOG_LEVEL: 'debug',
  MODE: 'prod',
  SERVER_ENDPOINT: 'api.telos.net',
  SERVER_PORT: 4000,
  recaptchaClientKey: '6LeGBeEZAAAAAHP1EkKhZ1ECxlLgXD8Dr8c9nkuz',
  recaptchaServerkey: '6LeGBeEZAAAAAGngFPZNYXMBrMK0JUr3-qvgujcf',
  recaptchaTableName: 'prod-recaptcha-accounts'
}

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
