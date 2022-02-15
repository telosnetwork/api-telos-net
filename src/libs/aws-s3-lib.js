const AWS = require("aws-sdk");
const clientS3 = new AWS.S3();
const Bucket = process.env.VERIFIED_CONTRACTS_BUCKET;
const SOURCE_FILENAME = 'source.json';
const METADATA_FILENAME = 'metadata.json'

async function isVerified(contractAddress){
    let headInfo;
    const params = { Bucket , Key: `${contractAddress}/${SOURCE_FILENAME}` };
    try{
        await clientS3.headObject(params).promise();  
        return true;
    }catch(e){
        //aws returns 404 if key isn't found
        return false; 
    }
}
  
async function getSource(contractAddress, fileName ){
    const params = { Bucket , Key: `${contractAddress}/${fileName}` };
    try{
        return await clientS3.getObject(params).promise();
    }catch(e){
        return { status: 404, message: 'file not found'}
    }
}
  
async function uploadObject(contractAddress, buffer, Bucket){
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

module.exports = { isVerified, getSource, uploadObject, SOURCE_FILENAME, METADATA_FILENAME }
