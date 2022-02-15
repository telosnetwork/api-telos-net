const envShared = {
  accountCreatorAccount: 'accounts.tf',
  accountCreatorContract: 'free.tf',
  sentryDsn: 'https://4fb0b518dbf74512a27bf8bb24977136@sentry.io/1749694',
  testnetApiEndPoint: 'https://testnet.telos.caleos.io',
  testnetAutorotateAccount: 'autorotate',
  testnetAutorotateKey: 'testnet-autorotate-key',
  testnetFaucetTableName: 'FaucetActivity',
  testnetFaucetSecondaryIndex: 'AccountName',
  testnetFaucetAccount: 'faucet.tf',
  testnetFaucetKey: 'testnet-faucet-key',
  twilioAccountSid: 'tf-twilio-sid',
  twilioAuthToken: 'tf-twilio-auth',
  twilioSmsNumber: '+18178356742',
  moonpaySecretKey: 'sk_live_Wd8ggfnxz4fWk0n9DSfkEKjr5T3k7Mes',
  recaptchaClientKey: '6Ld-_eIZAAAAAF6JsrFudo_uQjRL4eqPAZE40I3o',
  recaptchaServerkey: '6Ld-_eIZAAAAAHNKjH47BPSMdVltMNpSosc0hr0a',
  recaptchaTableName: 'prod-recaptcha-accounts',
  API_LOG_LEVEL: 'debug',
  SERVER_HOSTNAME: 'api-2051445629.us-east-1.elb.amazonaws.com'
};

const envLocal = {
  SERVER_ENDPOINT:'localhost:9999',
  SERVER_PORT:9999
};

const envDev = {
  NODE_ENV: 'development',
  tableName: 'dev-accounts',
  testnetRotationTableName: 'dev-testnet-rotation',
  accountCreatorKey: 'tf-account-creator-key-dev',
  allowDeleteNumber: 'Y',
  evmProvider:'https://testnet.telos.net/evm',
  evmHyperionProvider: 'https://testnet.telos.net/v2/evm',  
  eosioApiEndPoint: 'https://testnet.telos.caleos.io',
  hyperionEndpoint: 'https://testnet.telos.caleos.io',
  MODE: 'dev',
  SERVER_ENDPOINT: 'api-dev.telos.net',
  SERVER_PORT: 3000,
  TIME_SPAN: 5
};

const envProd = {
  NODE_ENV: 'production',
  tableName: 'prod-accounts',
  testnetRotationTableName: 'prod-testnet-rotation',
  accountCreatorKey: 'tf-account-creator-key-prod',
  allowDeleteNumber: 'N',
  evmProvider:'https://mainnet.telos.net/evm',
  evmHyperionProvider: 'https://mainnet.telos.net/v2/evm',  
  eosioApiEndPoint: 'https://telos.caleos.io',
  hyperionEndpoint: 'https://telos.caleos.io',
  MODE: 'prod',
  SERVER_ENDPOINT: 'api.telos.net',
  SERVER_PORT: 4000,
  TIME_SPAN: 10080
};

const sharedConfig = {
  script: 'src/app.js',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
};

const localConfig = {
  name: 'api-local',
  watch: true,
  autorestart: false,
  env: { ...envShared,...envProd, ...envLocal}
};

const devConfig = {
  name: 'api-dev',
  watch: true,
  env: {...envShared, ...envDev}
};

const prodConfig = {
  name: 'api-prod',
  watch: false,
  env: {...envShared, ...envProd}
};

const local = { ...sharedConfig, ...localConfig };
const dev = { ...sharedConfig, ...devConfig };
const prod = { ...sharedConfig, ...prodConfig };

module.exports = {
  apps: [local, dev, prod]
};
