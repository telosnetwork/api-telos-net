const { TelosEvmApi } = require("@telosnetwork/telosevm-js");

const fetch = require("node-fetch");
const evmContractAccount = "evmcontract2";
const evmNormalAccount = "evmaccount11";
const SYSTEM_SYMBOL = "TLOS";

const { getKeyBySecretName } = require("./auth-lib");

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

module.exports = { evmFaucetTransfer };
