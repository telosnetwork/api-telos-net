const eosioLib = require("../libs/eosio-lib");
const axios = require("axios");
const crypto = require("crypto");

const moonpayUrlOpts = {
    schema: {
        tags: ['trading'],
        body: {
            required: ['urlToSign'],
            type: 'object',
            properties: {
                urlToSign: {
                    description: 'URL to sign, will be checked for target account and valid Telos account name',
                    type: 'string'
                },
            }
        },
        response: {
            200: {
                description: 'URL is valid and signature has been added',
                type: 'null'
            },
            400: {
                description: 'URL signing failure',
                type: 'string'
            }
        }
    }
}

async function moonpayUrlHandler(request, reply) {

    let originalUrl = request.body.urlToSign;
    let url = new URL(originalUrl);

    let walletAddress = url.searchParams.get('walletAddress');
    let walletAddressTag = url.searchParams.get('walletAddressTag');
    
    if (!walletAddress || walletAddress != "tradefortlos") {
        return reply.code(400).send("Must specify walletAddress as tradefortlos");
    }

    if (!walletAddressTag) {
        return reply.code(400).send("Must specify walletAddressTag as target Telos account name");
    }

    let accountExists = await eosioLib.accountExists(walletAddressTag);
    if (!accountExists) {
        return reply.code(400).send(`${walletAddressTag} is not a valid Telos account`);
    }

    const signature = crypto
      .createHmac('sha256', process.env.moonpaySecretKey)
      .update(url.search)
      .digest('base64');
    
    const urlWithSignature = `${originalUrl}&signature=${encodeURIComponent(signature)}`;
    reply.send(urlWithSignature);
}

module.exports = async (fastify, options) => {
    fastify.post('trading/getMoonpaySwapUrl', moonpayUrlOpts, moonpayUrlHandler)
}