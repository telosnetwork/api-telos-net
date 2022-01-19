const AWS = require("aws-sdk");
const configOptionsAws =
  new AWS.Config({
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
    region: config.s3Region,
    endpoint: config.s3Endpoint,
    sslEnabled: true,
    s3ForcePathStyle: true
});
AWS.config.update(configOptionsAws);
const clientS3 = new AWS.S3();
const { reject } = require("core-js/fn/promise");
const { resolve } = require("path");
const Bucket = process.env.VERIFIED_CONTRACTS_BUCKET;
const params = { Bucket , Key: fileName, Body: outputObj};

function getObject(contractNAme){
    clientS3.getObject(params, function (err, data) {
        return err ? reject(err) : resolve(data); 
  });
}

function uploadObject(outputObj){
    clientS3.putObject(params, function (err, data) {
         return err ? reject(err) : resolve(data); 
   });
}

module.exports = { getObject, uploadObject }
