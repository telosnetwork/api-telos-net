const AWS = require("aws-sdk");
const clientS3 = new AWS.S3();
const Bucket = process.env.VERIFIED_CONTRACTS_BUCKET;
const OUTPUT_FILENAME = 'output.json';

async function isVerified(contractAddress){
    let headInfo;
    const params = { Bucket , Key: `${contractAddress}/${OUTPUT_FILENAME}` };
    try{
        headInfo = await clientS3.headObject(params).promise();  
    }catch(e){
        //aws returns 404 if key isn't found
        return { status: false, message: 'contract has not been verified' };
    }
    return { status: true, message: headInfo.LastModified};    
}

async function uploadObject(contractAddress, buffer, contentType){
    const params = { 
        Bucket , 
        Key: contractAddress, 
        Body: buffer, 
        ACL: 'public-read', 
        ContentType: contentType
    };
    try{
        return await clientS3.putObject(params).promise();
    }catch(e){
        return e;
    }
}

module.exports = { isVerified, uploadObject }
