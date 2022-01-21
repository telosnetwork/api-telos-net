const verificationLib = require("../libs/verification-lib");
const { isVerified } = require("../libs/aws-s3-lib");

const parseMultiForm = (request, done) => {
    /* interceptor for multi-form (files) */
    done();  
};

const statusOpts = {
    schema: {
        summary: 'returns current verifcation status of contract',
        tags: ['evm'],
        querystring: {
            contractAddress: {
                type: 'string'
            }
        }
    },
    response: {
        200: {
            description: 'returns object with boolean "status" along with message string. If verified, message is verification timestamp.',
            type: 'object'
        },
        400: {
            description: 'request failed',
            type: 'string'
        }
    }
};

const statusHandler = async(request, reply) => {
    const contractAddress = request.query.contractAddress;
    const isContract = await verificationLib.isContract(contractAddress);

    if (!isContract){
        return reply.code(400).send(`${contractAddress} is not a valid contract address`);
    }

    const status = await isVerified(contractAddress);
    reply.code(200).send(status);
};

const verificationOpts = {
    schema: {
        summary: 'verifies source code for solidity contract',
        tags: ['evm'],
        body: {
            required: ['compilerVersion', 'contractAddress', 'files', 'optimizer', 'runs', 'targetEvm'],
            type: 'object',
            properties: {
                contractAddress: {
                    description: 'address of deployed contract',
                    type: 'string',
                    example: '0xc4c89dD46524c6f704e92a9Cd012a3EbaDAdFF36'
                },
                compilerVersion: {
                    description: "compiler version. see https://github.com/ethereum/solc-bin/blob/gh-pages/bin/list.json",
                    type: 'string',
                    example: 'v0.4.23+commit.124ca40d'
                },
                files: {
                    description: "a single file object, array of file objects, or string containing contract code",
                    type: ['array', 'object', 'string'],
                    example: `[{ name: 'test.sol', code: 'pragma solidity 0.8.7 ...}, { name: test2.sol ...} ...]` 
                },
                sourceName: {
                    description: 'source or file name for contract. required when submitting raw contract code as string'
                },
                optimizer: {
                    description: 'flag for optimization when compiling',
                    type: 'boolean',
                    example: false
                },
                runs: {
                    description: 'Optimization value for frequency',
                    type: 'number',
                    example: 200
                },
                targetEvm: {
                    description: 'Target EVM',
                    type: 'string',
                    example: 'byzantium'
                }
            }
        },
        response: {
            200: {
                description: 'request succeeded',
                type: 'null'
            },
            400: {
                description: 'request failed',
                type: 'string'
            }
        }
    }
}

const verificationHandler = async(request, reply) => {
    const contractAddress = request.body.contractAddress;
    const compilerVersion = request.body.compilerVersion;
    const contractCode = request.body.files;

    if (!contractAddress ) {
        return reply.code(400).send("Must specify deployed contract address");
    }

    const isContractAddress = await verificationLib.isContract(contractAddress);

    if (!isContractAddress) {
        return reply.code(400).send(`${contractAddress} is not a valid contract address`);
    }

    if (!compilerVersion ) {
        return reply.code(400).send("Must specify compiler version");
    }

    if (!contractCode ) {
        return reply.code(400).send("No contract code submitted");
    }

    const verificationStatus = await verificationLib.verifyContract(request.body);
    const result = verificationStatus ? { message: 'Success! Contract verified!', type: 'positive' } : { message: 'Verification failed. Check that settings match those used during deployment. Click here for troubleshooting tips.', type: 'negative'};
    reply.send(JSON.stringify(result));
}

module.exports = async (fastify, options) => {
    fastify.get('contracts/status:contractAddress', statusOpts, statusHandler);
    fastify.post('contracts/verify', verificationOpts, verificationHandler)
    fastify.addContentTypeParser('multipart/form-data', parseMultiForm);
}