const AWS = require("aws-sdk");
const clientS3 = new AWS.S3();
const Bucket = process.env.VERIFIED_CONTRACTS_BUCKET;

async function isVerified(fileName){
    const params = { Bucket , Key: fileName };
        try{
            await clientS3.headObject(params, (err, data) => {
                return err ? false : !data.deleteMarker && data.ContentLength 
            });
        }catch(e){
            return false
        }
}

async function uploadObject(fileName, outputObj){
    const params = { Bucket , Key: fileName, Body: outputObj, ACL: 'public-read'};
    try{
        return await clientS3.putObject(params);
    }catch(e){
        return e;
    }
}

module.exports = { isVerified, uploadObject }
