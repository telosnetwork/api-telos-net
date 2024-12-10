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

const { ethers } = require("ethers");
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
  return transferResult;
}

/**
 * testnetZkEvmFaucetTransfer:
 * This function uses ethers.js to send ETH to the given EVM address on the zkEVM network.
 * It retrieves a private key from AWS secrets, creates a wallet, and sends a fixed amount of ETH.
 */
async function testnetZkEvmFaucetTransfer(evmAddress) {
  // Retrieve the private key from secrets
  const pk = await getKeyBySecretName(process.env.zkEvmFaucetKey);

  // Connect to zkEVM RPC endpoint
  const provider = new ethers.providers.JsonRpcProvider(process.env.zkEvmRpcEndpoint);
  const wallet = new ethers.Wallet(pk, provider);

  // Define the amount of ETH to send. For example, 0.1 ETH:
  const amountToSend = "50.0"; 
  const tx = {
    to: evmAddress,
    value: ethers.utils.parseEther(amountToSend)
  };

  // Send transaction
  const txResponse = await wallet.sendTransaction(tx);
  await txResponse.wait();

  return txResponse;
}

module.exports = { evmFaucetTransfer, getTokens, getSymbolsArray, testnetZkEvmFaucetTransfer };
