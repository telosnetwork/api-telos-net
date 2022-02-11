const { isVerified, getSource } = require("../libs/aws-s3-lib");

const parseMultiForm = (request, done) => { //@TODO check if needed
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
    const isContract = await verificationLib.isContract(contractAddress.substring(0,42));//@TODO may not need this 

    if (!isContract){
        return reply.code(400).send(`${contractAddress} is not a valid contract address`);
    }

    const status = await isVerified(contractAddress);
    reply.code(200).send(status);
};

const sourceOpts = {
    schema: {
        summary: 'returns source files',
        tags: ['evm'],
        querystring: {
            contractAddress: {
                type: 'string'
            }
        }
    },
    response: {
        200: {
            description: 'returns metadata and source files',
            type: 'array'
        },
        400: {
            description: 'request failed',
            type: 'string'
        }
    }
};

const sourceHandler = async(request, reply) => {
    const contractAddress = request.query.contractAddress;

    const sources = await getSource(contractAddress);

    reply.code(200).send(sources);
};

module.exports = async (fastify, options) => {
    fastify.get('contracts/status:contractAddress', statusOpts, statusHandler);
    fastify.get('contracts/source:contractAddress', sourceOpts, sourceHandler);
    fastify.addContentTypeParser('multipart/form-data', parseMultiForm); //@TODO may not need this
}