import axios from 'axios';
import { isVerified, uploadObject, SOURCE_FILENAME, METADATA_FILENAME } from './aws-s3-lib.js';

const CHAIN_ID = 40;
const TESTNET_CHAIN_ID = 41;
const CONTRACTS_BUCKET = 'verified-evm-contracts';
const TESTNET_CONTRACTS_BUCKET = 'verified-evm-contracts-testnet';
// Silenced addresses like ElkRouter on mainnet wich was somehow partially verified without metadata.json file (it was one of our first contracts on mainnet)
const SILENCED_ADDRESSES = [
  '0x75840EBB437981a3F3F1F004513821E0CcDCFC21'
];
async function getVerifiedContracts(chainId) {
  let contracts = [];
  let hasMore = true;
  let page = 1;
  let limit = 200;
  while (hasMore) {
    try {
      let results = await axios.get(
        `https://sourcify.dev/server/files/contracts/any/${chainId}?page=${page}&limit=${limit}`
      );
      if (results?.data) {
        if (results.data.results.length < limit) {
          hasMore = false;
        }
        page++;
        contracts = contracts.concat(results.data.results);
      }
    } catch (e) {
      console.log(e);
    }
  }
  return contracts;
}

async function getSource(contractAddress, chainId) {
  try {
    return await axios.get(
      `https://sourcify.dev/server/files/any/${chainId}/${contractAddress}`
    );
  } catch (e) {
    console.log(e);
  }
}

async function updateVerifiedContractsData(verifiedList, chainId, bucket) {
  let newCount = 0;
  for (let address of verifiedList) {
    if (!await isVerified(address, bucket)) { //check if already in bucket
      const source = await getSource(address, chainId);
      if (source && source.data) {
        const metadata = source.data.files.find(file => file.name === 'metadata.json');
        try {
          if (metadata) {
            let buffer = Buffer.from(JSON.stringify(metadata));
            await uploadObject(`${address}/${METADATA_FILENAME}`, buffer, bucket);
            buffer = Buffer.from(JSON.stringify(source.data));
            await uploadObject(`${address}/${SOURCE_FILENAME}`, buffer, bucket);
            newCount++;
          }
        } catch (e) {
          if (!SILENCED_ADDRESSES.includes(address)) {
            console.log(`Exception when trying to upload for address: ${address}`);
            console.log(e);
          }
        }
      }
    }
  }
  return newCount;
}

/**
 * run this file with node to get all contract verified addresses from sourcify,
 * fetch the source files, and upload to s3 for querying & rendering in app
 */
(async function () {
  let updateCount;
  let verifiedList = await getVerifiedContracts(CHAIN_ID);
  if(verifiedList.length > 0) {
    updateCount = await updateVerifiedContractsData(verifiedList, CHAIN_ID, CONTRACTS_BUCKET);
    console.log(`Added ${updateCount} new verified contracts on mainnet`);
  }
  verifiedList = await getVerifiedContracts(TESTNET_CHAIN_ID);
  if(verifiedList.length > 0) {
    updateCount = await updateVerifiedContractsData(verifiedList, TESTNET_CHAIN_ID, TESTNET_CONTRACTS_BUCKET);
    console.log(`Added ${updateCount} new verified contracts on testnet`);
  }
})();
