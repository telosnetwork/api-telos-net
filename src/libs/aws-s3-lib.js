const AWS = require("aws-sdk");
// const configOptionsAws =
//   new AWS.Config({
//     accessKeyId: config.s3AccessKeyId,
//     secretAccessKey: config.s3SecretAccessKey,
//     region: config.s3Region,
//     endpoint: config.s3Endpoint,
//     sslEnabled: true,
//     s3ForcePathStyle: true
// });
// AWS.config.update(configOptionsAws);
const clientS3 = new AWS.S3();
const Bucket = process.env.VERIFIED_CONTRACTS_BUCKET;

async function getObject(fileName){
    const params = { Bucket , Key: fileName };
    try{
        let test = await clientS3.getObject(params);
        return test;
    }catch(e){
        return e;
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

module.exports = { getObject, uploadObject }
