const verificationLib = require("../libs/verification-lib");

const parseMultiForm = (request, done) => {
    const files = request.files;
    for (let i in files){
        files[i]['code'] = files[i].data.toString('utf8');
    }
    done();  
};

const verificationOpts = {
    schema: {
        summary: 'verifies source code for solidity contract',
        tags: ['evm'],
        body: {
            required: ['compilerVersion'],
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
                // files: {
                //     description: "array of file objects containing code as string",
                //     type: 'array',
                //     example: `[{ name: 'test.sol', code: 'pragma solidity 0.8.7 ...}, { name: test2.sol ...} ...]` 
                // },
                // optimized: {
                //     description: 'flag for optimization when compiling',
                //     type: 'boolean',
                //     example: false
                // },
                // runs: {
                //     description: 'Optimization value for frequency',
                //     type: 'number',
                //     example: 200
                // }
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

const verificationHandler = async(request, reply) => {

    // const contractAddress = request.body.contractAddress;
    const compilerVersion = request.body.compilerVersion;
    const contractCode = request.body.files[0].code;

    // if (!contractAddress ) {
    //     return reply.code(400).send("Must specify deployed contract address");
    // }

    // const isContractAddress = await verificationLib.isContract(contractAddress);

    // if (!isContractAddress) {
    //     return reply.code(400).send(`${contractAddress} is not a valid contract address`);
    // }

    if (!compilerVersion ) {
        return reply.code(400).send("Must specify compiler version");
    }

    if (!contractCode ) {
        return reply.code(400).send("No contract code submitted");
    }

    const verificationStatus = await verificationLib.verifyContract(request.body);
    const message = verificationStatus ? 'Contract verified' : 'Verification failed';
    reply.send(message);
}

// const fileUploadOpts = {
//     schema: {
//         tags: ['evm'],
//         summary: 'upload solidity contract file(s)',
//         body: {
//             type: 'object',
//             properties: {
//                 compilerVersion: { 
//                     type: 'string',
//                 },
//                 files: {
//                     type: 'array'
//                 }

//             }
//       }
//     },
//     response: {
//         200: {
//           description: 'Succesful upload',
//           type: 'object',
//           properties: {
//             path: {type: 'string'}
//           }
//         },
//         500: {
//           description: 'Error response',
//           type: 'object',
//           properties: {
//             error: {type: 'string'},
//             message: {type: 'string'},
//             statusCode: {type: 'number'}
//           }
//         }
//       }
// };

// const fileUploadHandler = async (request, reply) => {
//     reply.send(200);
//   }

module.exports = async (fastify, options) => {
    fastify.post('contracts/verify', verificationOpts, verificationHandler)
    // fastify.post('contracts/upload', fileUploadOpts, fileUploadHandler)
    fastify.addContentTypeParser('multipart/form-data', parseMultiForm);
}