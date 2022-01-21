const AWS = require("aws-sdk");
const clientS3 = new AWS.S3();
const Bucket = process.env.VERIFIED_CONTRACTS_BUCKET;

async function isVerified(contractAddress){
    let headInfo;
    const params = { Bucket , Key: contractAddress };
    try{
        headInfo = await clientS3.headObject(params).promise();  
    }catch(e){
        //aws returns 404 if key isn't found
        return { status: false, message: 'contract has not been verified' };
    }
    return { status: true, message: headInfo.LastModified};    
}

async function uploadObject(contractAddress, outputObj){
    const params = { Bucket , Key: contractAddress, Body: outputObj, ACL: 'public-read'};
    try{
        return await clientS3.putObject(params).promise();
    }catch(e){
        return e;
    }
}

module.exports = { isVerified, uploadObject }
