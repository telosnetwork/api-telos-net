const AWS = require("aws-sdk");
const clientS3 = new AWS.S3();
const Bucket = process.env.VERIFIED_CONTRACTS_BUCKET;
const OUTPUT_FILENAME = 'output.json';
const INPUT_FILENAME = 'input.json';
const ABI_FILENAME = 'abi.json';

async function isVerified(contractAddress){
    let headInfo;
    const params = { Bucket , Key: `${contractAddress}/${OUTPUT_FILENAME}` };
    try{
        headInfo = await clientS3.headObject(params).promise();  
    }catch(e){
        //aws returns 404 if key isn't found
        return { status: 404, message: 'contract has not been verified' };
    }
    return { status: true, message: headInfo.LastModified};    
}

async function getOutput(contractAddress){
    const params = { Bucket , Key: `${contractAddress}/${OUTPUT_FILENAME}` };
    try{
        return await clientS3.getObject(params).promise();
    }catch(e){
        return { status: 404, message: 'file not found'}
    }
}

async function getInput(contractAddress){
    const params = { Bucket , Key: `${contractAddress}/${INPUT_FILENAME}` };
    try{
        return await clientS3.getObject(params).promise();
    }catch(e){
        return { status: 404, message: 'file not found'}
    }
}

async function getAbi(contractAddress){
    const params = { Bucket , Key: `${contractAddress}/${ABI_FILENAME}` };
    try{
        return await clientS3.getObject(params).promise();
    }catch(e){
        return { status: 404, message: 'file not found'}
    }
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

module.exports = { isVerified, uploadObject, getOutput, getInput, getAbi }
