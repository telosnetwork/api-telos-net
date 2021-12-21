const { getLastVoted, rotate, validateUserAccount, create, faucet, evmFaucet } = require("../libs/testnet-lib");

const faucetOpts = {
    schema: {
        tags: ['testnet'],
        params: {
            type: 'object',
            properties: {
                'accountName': {
                    description: 'Account name to receive TLOS',
                    type: 'string'
                }
            },
            required: ['accountName']
        },
        response: {
            204: {
                description: 'Faucet successful',
                type: 'null'
            },
            400: {
                description: 'Faucet error',
                type: 'string'
            }
        }
    }
}

async function faucetHandler(request, reply) {
    try {
        const ipAddress = request.ips.pop();
        const actionAllowed = await validateUserAccount(ipAddress, request.params.accountName)
        if (!actionAllowed){
            reply.code(403).send('IP or account has recieved faucet funds within the last 24 hours, please wait and try again');
            return;
        }
        await faucet(request.params.accountName);
        reply.code(204);
    } catch (e) {
        reply.code(400).send(`Error pouring the faucet: ${e.message}`);
    }
}

const evmFaucetOpts = {
    schema: {
        tags: ['testnet'],
        params: {
            type: 'object',
            properties: {
                'evmAddress': {
                    description: 'TelosEVM address to send the EVM TLOS to',
                    type: 'string'
                }
            },
            required: ['evmAddress']
        },
        response: {
            204: {
                description: 'Faucet successful',
                type: 'null'
            },
            400: {
                description: 'Faucet error',
                type: 'string'
            }
        }
    }
}

async function evmFaucetHandler(request, reply) {
    try {
        const ipAddress = request.ips.pop();
        const actionAllowed = await validateUserAccount(ipAddress, request.params.evmAddress)
        if (!actionAllowed){
            reply.code(403).send('IP or account has recieved faucet funds within the last 24 hours, please wait and try again');
            return;
        }
        await evmFaucet(request.params.evmAddress);
        reply.code(204);
    } catch (e) {
        reply.code(400).send(`Error pouring the faucet: ${e.message}`);
    }
}

const accountOpts = {
    schema: {
        tags: ['testnet'],
        body: {
            required: ['accountName', 'ownerKey', 'activeKey'],
            type: 'object',
            properties: {
                accountName: {
                    type: 'string',
                    description: '12 character account name, only characters a-z and 1-5 can be used',
                    example: 'myaccount123'
                },
                ownerKey: {
                    type: 'string',
                    description: 'Owner public key',
                    example: 'EOS1234...'
                },
                activeKey: {
                    type: 'string',
                    description: 'Active public key',
                    example: 'EOS4321...'
                }
            }
        },
        response: {
            200: {
                description: 'Transaction id',
                type: 'string',
                example: '31940262645f44299d1d5d02fb9b313dc9e6b9904677f1410bb63247c9dec234'
            },
            400: {
                description: 'Rotation error',
                type: 'string'
            }
        }
    }
}

async function accountHandler(request, reply) {
    try {
        const ipAddress = request.ips.pop();
        const actionAllowed = await validateUserAccount(ipAddress)
        if (!actionAllowed){
            reply.code(403).send('IP or account has recieved faucet funds within the last 24 hours, please wait and try again');
            return;
        }
        const result = await create(request.body.accountName, request.body.ownerKey, request.body.activeKey);
        reply.send(result.transaction_id)
    } catch (e) {
        reply.code(400).send(`Error creating account: ${e.message}`);
    }
}

const addToRotationOpts = {
    schema: {
        tags: ['testnet'],
        params: {
            type: 'object',
            properties: {
                'bpAccount': {
                    description: 'BP account to add to rotation',
                    type: 'string'
                }
            },
            required: ['bpAccount']
        },
        response: {
            204: {
                description: 'Rotation successful',
                type: 'null'
            },
            400: {
                description: 'Rotation error',
                type: 'string'
            }
        }
    }
}

async function addToRotationHandler(request, reply) {
    let result = await rotate(request.params.bpAccount);
    if (!result.success)
        reply.code(400).send(`Error trying to rotate: ${result.message}`)
    else
        reply.code(204)
}

const autorotateOpts = {
    schema: {
        tags: ['testnet'],
        response: {
            204: {
                description: 'Rotation successful',
                type: 'null'
            },
            400: {
                description: 'Rotation error',
                type: 'string'
            }
        }
    }
}

async function autorotateHandler(request, reply) {
    const result = await rotate();
    if (!result.success)
        reply.code(400).send(`Error trying to rotate: ${result.message}`)
    else
        reply.code(204)
}

const getRotationScheduleOpts = {
    schema: {
        tags: ['testnet'],
        response: {
            200: {
                description: 'The current rotation schedule',
                example: [
                    'producer1',
                    'producer2',
                    'producer3'
                ],
                type: 'array',
                items: {
                    type: 'string'
                }
            }
        }
    }
}

async function getRotationScheduleHandler(request, reply) {
    reply.send(await getLastVoted());
}

module.exports = async (fastify, options) => {
    fastify.get('testnet/rotation_schedule', getRotationScheduleOpts, getRotationScheduleHandler)
    fastify.get('testnet/rotate', autorotateOpts, autorotateHandler)
    fastify.get('testnet/produce/:bpAccount', addToRotationOpts, addToRotationHandler)
    fastify.get('testnet/faucet/:accountName', faucetOpts, faucetHandler)
    fastify.get('testnet/evmFaucet/:evmAddress', evmFaucetOpts, evmFaucetHandler)
    fastify.post('testnet/account', accountOpts, accountHandler)
}