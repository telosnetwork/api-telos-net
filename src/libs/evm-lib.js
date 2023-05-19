const { TelosEvmApi } = require("@telosnetwork/telosevm-js");
const  axios = require("axios");

const fetch = require("node-fetch");
const evmContractAccount = "evmcontract2";
const evmNormalAccount = "evmaccount11";
const SYSTEM_SYMBOL = "TLOS";
const TOKEN_LIST_URL = 'https://raw.githubusercontent.com/telosnetwork/token-list/main/telosevm.tokenlist.json';
const WRAPPED_SYMBOLS = [
    'BTC', SYSTEM_SYMBOL
];

const { getKeyBySecretName } = require("./auth-lib");

function getSymbolsArray(symbolsStr){
  const symbols = symbolsStr?.toUpperCase().split(',');
  for(let i in symbols){
    if(WRAPPED_SYMBOLS.includes(symbols[i])){
      symbols[i] = "W" + symbols[i];
    }
  }
  return symbols;
}

async function getTokens(symbols){
  try {
    const results = await axios.get(TOKEN_LIST_URL);
    if(results?.data?.tokens.length > 0){
      let tokens =  results.data.tokens.filter((token) => {
        return (parseInt(token.chainId) === parseInt(process.env.EVM_CHAIN_ID) && symbols.includes(token.symbol.toUpperCase()));
      });
      console.log(tokens);
      return tokens;
    }
  } catch (e) {
    console.error('Could not retrieve EVM token list', e)
  }
  return [];
}

async function makeEvmApi() {
  const pk = await getKeyBySecretName(process.env.testnetFaucetKey);

  return new TelosEvmApi({
    endpoint: process.env.testnetApiEndPoint,
    chainId: 41,
    ethPrivateKeys: [],
    telosContract: "eosio.evm",
    fetch,
    telosPrivateKeys: [pk],
  });
}

async function evmFaucetTransfer(evmAddress, quantity) {
  const api = await makeEvmApi();
  const sender = await api.telos.getEthAccountByTelosAccount(
    process.env.testnetFaucetAccount
  );
  const transferResult = await api.transfer({
    account: process.env.testnetFaucetAccount,
    sender: sender.address,
    to: evmAddress,
    quantity,
  });
}

module.exports = { evmFaucetTransfer, getTokens, getSymbolsArray };
