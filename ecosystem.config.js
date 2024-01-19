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
  recaptchaClientKey: '6Ld-_eIZAAAAAF6JsrFudo_uQjRL4eqPAZE40I3o',
  recaptchaServerkey: '6Ld-_eIZAAAAAHNKjH47BPSMdVltMNpSosc0hr0a',
  recaptchaTableName: 'prod-recaptcha-accounts',
  API_LOG_LEVEL: 'debug',
  SERVER_HOSTNAME: 'api-2051445629.us-east-1.elb.amazonaws.com',
  // GOOGLE_CLIENT_ID: '56634824599-ff3iu788c32c3s7ec65cs4bieop9gpgv.apps.googleusercontent.com',
  GOOGLE_CLIENT_ID: '639241197544-kcubenhmti6u7ef3uj360n2lcl5cmn8c.apps.googleusercontent.com',
  // FIXME: This is a auxillary key for the app, it should be replaced for the one commented
  STLOS_ABI: [{"inputs":[{"internalType":"contract IERC20Metadata","name":"asset_","type":"address"},{"internalType":"contract ITelosEscrow","name":"escrow_","type":"address"},{"internalType":"address","name":"admin_","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"assets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"caller","type":"address"},{"indexed":true,"internalType":"address","name":"receiver","type":"address"},{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"assets","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"shares","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[],"name":"_admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_escrow","outputs":[{"internalType":"contract ITelosEscrow","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"asset","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"convertToAssets","outputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"convertToShares","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"depositTLOS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"maxDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"maxMint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"maxRedeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"maxWithdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"previewDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"previewMint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"}],"name":"previewRedeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"}],"name":"previewWithdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"redeem","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"admin_","type":"address"}],"name":"setAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ITelosEscrow","name":"escrow_","type":"address"}],"name":"setEscrow","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalAssets","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"assets","type":"uint256"},{"internalType":"address","name":"receiver","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]
};

const envLocal = {
  SERVER_ENDPOINT:'localhost:9999',
  SERVER_PORT:9999
};

const envDev = {
  NODE_ENV: 'development',
  tableName: 'dev-accounts',
  googleUsersTableName: 'dev-google-users-accounts',
  testnetRotationTableName: 'dev-testnet-rotation',
  accountCreatorKey: 'tf-account-creator-key-dev',
  allowDeleteNumber: 'Y',
  marketdataTableName: 'dev-marketdata',
  evmProvider:'https://testnet.telos.net/evm',
  evmHyperionProvider: 'https://testnet.telos.net/v2/evm',  
  eosioApiEndPoint: 'https://testnet.telos.caleos.io',
  hyperionEndpoint: 'https://testnet.telos.caleos.io',
  MODE: 'dev',
  SERVER_ENDPOINT: 'api-dev.telos.net',
  SERVER_PORT: 3000,
  TIME_SPAN: 5,
  STLOS_CONTRACT: '0xa9991e4daa44922d00a78b6d986cdf628d46c4dd',
  NETWORK_EVM_RPC: 'https://testnet.telos.net/evm',
  EVM_CHAIN_ID: 41
};

const envProd = {
  NODE_ENV: 'production',
  tableName: 'prod-accounts',
  googleUsersTableName: 'prod-google-users-accounts',
  testnetRotationTableName: 'prod-testnet-rotation',
  accountCreatorKey: 'tf-account-creator-key-prod',
  marketdataTableName: 'prod-marketdata',
  allowDeleteNumber: 'N',
  evmProvider:'https://mainnet.telos.net/evm',
  evmHyperionProvider: 'https://mainnet.telos.net/v2/evm',  
  eosioApiEndPoint: 'https://telos.caleos.io',
  hyperionEndpoint: 'https://telos.caleos.io',
  MODE: 'prod',
  SERVER_ENDPOINT: 'api.telos.net',
  SERVER_PORT: 4000,
  TIME_SPAN: 10080,
  STLOS_CONTRACT: '0xb4b01216a5bc8f1c8a33cd990a1239030e60c905',
  NETWORK_EVM_RPC: 'https://mainnet.telos.net/evm',
  EVM_CHAIN_ID: 40
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
