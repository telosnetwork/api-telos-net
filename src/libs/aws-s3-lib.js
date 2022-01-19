const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

async function getBucket



GetObjectVersion

GetObject


var configOptionsAws =
  new AWS.Config({
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
    region: config.s3Region,
    endpoint: config.s3Endpoint,
    sslEnabled: true,
    s3ForcePathStyle: true
});

AWS.config.update(configOptionsAws);
var clientS3 = new AWS.S3();

const { reject } = require("core-js/fn/promise");
const { resolve } = require("path");
const Bucket = process.env.VERIFIED_CONTRACTS_BUCKET;
const Key = 
function getContract(contractNAme){

}

function uploadContract(outputObj){
    const params = { Bucket , Key: fileName, Body: output};
    clientS3.putObject(params, function (err, data) {
         return err ? reject(err) : resolve(); 
   });
}

module.exports = { getContract, uploadContract }
