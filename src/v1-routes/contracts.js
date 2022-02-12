const { isVerified, getSource } = require("../libs/aws-s3-lib");

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
    const status = await isVerified(request.query.contractAddress);
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
            description: 'returns all source files',
            type: 'array'
        },
        400: {
            description: 'request failed',
            type: 'string'
        }
    }
};

const sourceHandler = async(request, reply) => {
    const source = await getSource(request.query.contractAddress, 'metadata.json');
    reply.code(200).send(source);
};

module.exports = async (fastify, options) => {
    fastify.get('contracts/status:contractAddress', statusOpts, statusHandler);
    fastify.get('contracts/metadata:contractAddress', sourceOpts, sourceHandler);
    fastify.addContentTypeParser('multipart/form-data', parseMultiForm); 
}