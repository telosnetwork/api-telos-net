const verificationLib = require("../libs/verification-lib");
const axios = require("axios");

const verificationOpts = {
    schema: {
        tags: ['contract', 'verification', 'validation', 'source'],
        body: {
            required: ['contractAddress','fileName','compilerVersion', 'contractCode'],
            type: 'object',
            properties: {
                contractAddress: {
                    description: 'address of deployed contract',
                    type: 'string',
                    example: '0xc4c89dD46524c6f704e92a9Cd012a3EbaDAdFF36'
                },
                fileName: {
                    description: 'name of .sol file',
                    type: 'string',
                    example: 'HelloWorld.sol'
                },
                compilerVersion: {
                    description: "compiler version. see https://github.com/ethereum/solc-bin/blob/gh-pages/bin/list.json",
                    type: 'string',
                    example: 'v0.7.1+commit.f4a555be'
                },
                contractCode: {
                    description: "Raw string containing contract code",
                    type: 'string',
                    example: 'pragma solidity ^0.4.0; contract HelloWorld { ...'
                },
                optimized: {
                    description: 'flag for optimization when compiling',
                    type: 'boolean'
                },
                runs: {
                    description: 'Optimization value for frequency',
                    type: 'number',
                    example: '200'
                }
            }
        },
        response: {
            200: {
                description: '',
                type: 'null'
            },
            400: {
                description: 'request failed',
                type: 'string'
            }
        }
    }
}

async function verificationHandler(request, reply) {

    const contractAddress = request.body.contractAddress;
    const fileName = request.body.fileName;
    const compilerVersion = request.body.compilerVersion;
    const contractCode = request.body.contractCode;

    if (!contractAddress ) {
        return reply.code(400).send("Must specify deployed contract address");
    }
    
    if (!fileName ) {
        return reply.code(400).send("Must specify file name e.g. 'myContract.sol'");
    }

    if (!compilerVersion ) {
        return reply.code(400).send("Must specify compiler version");
    }

    if (!contractCode ) {
        return reply.code(400).send("No contract code submitted");
    }

    const isContract = await verificationLib.isContract(contractAddress);


    if (!isContract) {
        return reply.code(400).send(`${contractAddress} is not a valid contract address`);
    }

    const verificationStatus = await verifyContract(request.body);
    
    reply.send(verificationStatus);
}

module.exports = async (fastify, options) => {
    fastify.post('contract/verify', verificationOpts, verificationHandler)
}