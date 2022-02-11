const AWS = require("aws-sdk");
const clientS3 = new AWS.S3();
const Bucket = process.env.VERIFIED_CONTRACTS_BUCKET;
export const SOURCE_FILENAME = 'source.json';
export const METADATA_FILENAME = 'metadata.json';

async function isVerified(contractAddress){
    let headInfo;
    const params = { Bucket , Key: `${contractAddress}/${OUTPUT_FILENAME}` };
    try{
        await clientS3.headObject(params).promise();  
        return true;
    }catch(e){
        //aws returns 404 if key isn't found
        return false; 
    }
    return { status: true, message: headInfo.LastModified};    
}

export async function getMetadata(contractAddress){
    const params = { Bucket , Key: `${contractAddress}/${METADATA_FILENAME}` };
    try{
        return await clientS3.getObject(params).promise();
    }catch(e){
        return { status: 404, message: 'file not found'}
    }
  }
  
  export async function getSource(contractAddress){
    const params = { Bucket , Key: `${contractAddress}/${SOURCE_FILENAME}` };
    try{
        return await clientS3.getObject(params).promise();
    }catch(e){
        return { status: 404, message: 'file not found'}
    }
  }
  
  export async function uploadObject(contractAddress, buffer){
    const params = { 
        Bucket , 
        Key: contractAddress, 
        Body: buffer, 
        ACL: 'public-read', 
        ContentType: 'application/json'
    };
    try{
        return await clientS3.putObject(params).promise();
    }catch(e){
        return e;
    }
  }

module.exports = { isVerified, getMetadata, getSource, uploadObject }
