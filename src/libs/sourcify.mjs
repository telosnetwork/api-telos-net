import axios from 'axios';
import { isVerified, uploadObject, SOURCE_FILENAME, METADATA_FILENAME } from './aws-s3-lib.js';

const CHAIN_ID = 40;
const TESTNET_CHAIN_ID = 41;
const CONTRACTS_BUCKET = 'verified-evm-contracts';
const TESTNET_CONTRACTS_BUCKET = 'verified-evm-contracts-testnet';

async function getVerifiedContracts(chainId) {
  const results = { full: [], partial: [] };
  let page = 0;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const response = await axios.get(
        `https://sourcify.dev/server/files/contracts/any/${chainId}?page=${page}&resultsPerPage=200`
      );

      results.full.push(...response.data.results);
      hasNextPage = response.data.pagination.hasNextPage;
      page++;
    } catch (e) {
      console.log(e);
      hasNextPage = false;
    }
  }

  return results;
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
          // This address is ElkRouter on mainnet and somehow was partially verified without metadata.json file (it was one of our first contracts on mainnet)
          if (address != '0x75840EBB437981a3F3F1F004513821E0CcDCFC21') {
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
  let verifiedList = await getVerifiedContracts(CHAIN_ID);
  let updateCount = await updateVerifiedContractsData(verifiedList.full, CHAIN_ID, CONTRACTS_BUCKET);
  console.log(`Added ${updateCount} new verified contracts on mainnet`);
  
  verifiedList = await getVerifiedContracts(TESTNET_CHAIN_ID);
  updateCount = await updateVerifiedContractsData(verifiedList.full, TESTNET_CHAIN_ID, TESTNET_CONTRACTS_BUCKET);
  console.log(`Added ${updateCount} new verified contracts on testnet`);
})();
