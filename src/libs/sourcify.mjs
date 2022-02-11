import axios from 'axios';
import { isVerified, uploadObject, SOURCE_FILENAME, METADATA_FILENAME } from './aws-s3-lib.js';
const EVM_CHAIN_ID = 40; //41 for testnet

async function getVerifiedContracts(){
  try{
    return await axios.get(
      `https://sourcify.dev/server/files/contracts/${EVM_CHAIN_ID}`
      );
  }catch(e){
    console.log(e);
  }

}

async function getSource(contractAddress){
  try{
    return await axios.get(
      `https://sourcify.dev/server/files/${EVM_CHAIN_ID}/${contractAddress}`
      );
  }catch(e){
    console.log(e);
  }
}

async function updateVerifiedContractsData(verifiedList){
  let newCount = 0;
  for (let address of verifiedList){
    const source = await getSource(address);   
    console.log(source);
    const metadata = source.data.find(file => file.name === 'metadata.json');
    try{
      let buffer = new Buffer.from(JSON.stringify(metadata));
      await uploadObject(`${address}/${METADATA_FILENAME}`, buffer);
      buffer = new Buffer.from(JSON.stringify(source.data));
      await uploadObject(`${address}/${SOURCE_FILENAME}`, buffer)
    }catch(e){
      console.log(e)
    }
    newCount++;
  }
  return newCount;
}

/**
 * run this file with node to get all contract verified addresses from sourcify 
 * and upload the new ones to s3 for querying
 */
(async function() { 
  const verifiedList = await getVerifiedContracts();
  const updateCount = await updateVerifiedContractsData(verifiedList.data.full);
  console.log(`Added ${updateCount} new verified contracts!`)
})();