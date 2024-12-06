const {
  getLastVoted,
  rotate,
  validateUserAccount,
  create,
  faucet,
  evmFaucet,
  zkEvmFaucet,
  accountExists,
} = require('../libs/testnet-lib');

const faucetOpts = {
  schema: {
      tags: ['testnet'],
      params: {
          type: 'object',
          properties: {
              accountName: {
                  description: 'Account name to receive TLOS',
                  type: 'string',
              },
          },
          required: ['accountName'],
      },
      response: {
          204: {
              description: 'Faucet successful',
              type: 'null',
          },
          400: {
              description: 'Faucet error',
              type: 'string',
          },
      },
  },
};

async function faucetHandler(request, reply) {
  try {
      const ipAddress = request.ips.pop();
      const actionAllowed = await validateUserAccount(
          ipAddress,
          request.params.accountName
      );
      if (!actionAllowed) {
          return reply
              .code(429)
              .send(
                  'IP or account has recieved faucet funds within the last 24 hours, please wait and try again'
              );
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
              evmAddress: {
                  description: 'TelosEVM address to send the EVM TLOS to',
                  type: 'string',
              },
          },
          required: ['evmAddress'],
      },
      response: {
          204: {
              description: 'Faucet successful',
              type: 'null',
          },
          400: {
              description: 'Faucet error',
              type: 'string',
          },
      },
  },
};

async function evmFaucetHandler(request, reply) {
  try {
      const ipAddress = request.ips.pop();
      const actionAllowed = await validateUserAccount(
          ipAddress,
          request.params.evmAddress
      );
      if (!actionAllowed) {
          return reply
              .code(429)
              .send(
                  'IP or account has recieved faucet funds within the last 24 hours, please wait and try again'
              );
      }
      await evmFaucet(request.params.evmAddress);
      reply.code(204);
  } catch (e) {
      reply.code(400).send(`Error pouring the faucet: ${e.message}`);
  }
}

/**
* zkEvmFaucetOpts:
* Similar to evmFaucetOpts, but for the zkEVM network.
*/
const zkEvmFaucetOpts = {
  schema: {
      tags: ['testnet'],
      params: {
          type: 'object',
          properties: {
              evmAddress: {
                  description: 'zkEVM address to send ETH to',
                  type: 'string',
              },
          },
          required: ['evmAddress'],
      },
      response: {
          204: {
              description: 'Faucet successful',
              type: 'null',
          },
          400: {
              description: 'Faucet error',
              type: 'string',
          },
      },
  },
};

async function zkEvmFaucetHandler(request, reply) {
  try {
      const ipAddress = request.ips.pop();
      const actionAllowed = await validateUserAccount(
          ipAddress,
          request.params.evmAddress
      );
      if (!actionAllowed) {
          return reply
              .code(429)
              .send(
                  'IP or account has recieved faucet funds within the last 24 hours, please wait and try again'
              );
      }
      await zkEvmFaucet(request.params.evmAddress);
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
                  pattern: '^[a-z1-5]{12}$',
                  description:
                      '12 character account name, only characters a-z and 1-5 can be used',
                  example: 'myaccount123',
              },
              ownerKey: {
                  type: 'string',
                  pattern: '^EOS[0-9A-Za-z]{50}$',
                  description: 'Owner public key',
                  example: 'EOS1234...',
              },
              activeKey: {
                  type: 'string',
                  pattern: '^EOS[0-9A-Za-z]{50}$',
                  description: 'Active public key',
                  example: 'EOS4321...',
              },
          },
      },
      response: {
          200: {
              description: 'Transaction id',
              type: 'string',
              example:
                  '31940262645f44299d1d5d02fb9b313dc9e6b9904677f1410bb63247c9dec234',
          },
          400: {
              description: 'Faucet error',
              type: 'string',
              examples: [
                  {
                      name: 'Account exists',
                      value:
                          'Error creating account: Account ${accountName} already exists',
                  },
                  {
                      name: 'Generic error',
                      value: 'Error creating account: ${message}',
                  },
              ],
          },
      },
  },
};

async function accountHandler(request, reply) {
  try {
      const { accountName, ownerKey, activeKey } = request.body;

      const accountExistsResult = await accountExists(accountName);
      if (accountExistsResult) {
          return reply
              .code(400)
              .send(`Error creating account: Account ${accountName} already exists`);
      }

      const ipAddress = request.ips.pop();
      const actionAllowed = await validateUserAccount(ipAddress);
      if (!actionAllowed) {
          return reply
              .code(429)
              .send(
                  'IP or account has received faucet funds within the last 24 hours, please wait and try again'
              );
      }
      const result = await create(accountName, ownerKey, activeKey);
      reply.send(result.transaction_id);
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
              bpAccount: {
                  description: 'BP account to add to rotation',
                  type: 'string',
              },
          },
          required: ['bpAccount'],
      },
      response: {
          204: {
              description: 'Rotation successful',
              type: 'null',
          },
          400: {
              description: 'Rotation error',
              type: 'string',
          },
      },
  },
};

async function addToRotationHandler(request, reply) {
  let result = await rotate(request.params.bpAccount);
  if (!result.success)
      reply.code(400).send(`Error trying to rotate: ${result.message}`);
  else reply.code(204);
}

const autorotateOpts = {
  schema: {
      tags: ['testnet'],
      response: {
          204: {
              description: 'Rotation successful',
              type: 'null',
          },
          400: {
              description: 'Rotation error',
              type: 'string',
          },
      },
  },
};

async function autorotateHandler(request, reply) {
  const result = await rotate();
  if (!result.success)
      reply.code(400).send(`Error trying to rotate: ${result.message}`);
  else reply.code(204);
}

const getRotationScheduleOpts = {
  schema: {
      tags: ['testnet'],
      response: {
          200: {
              description: 'The current rotation schedule',
              example: ['producer1', 'producer2', 'producer3'],
              type: 'array',
              items: {
                  type: 'string',
              },
          },
      },
  },
};

async function getRotationScheduleHandler(request, reply) {
  reply.send(await getLastVoted());
}

module.exports = async (fastify, options) => {
    fastify.get(
        'testnet/rotation_schedule',
        getRotationScheduleOpts,
        getRotationScheduleHandler
    );
    fastify.get('testnet/rotate', autorotateOpts, autorotateHandler);
    fastify.get(
        'testnet/produce/:bpAccount',
        addToRotationOpts,
        addToRotationHandler
    );
    fastify.get('testnet/faucet/:accountName', faucetOpts, faucetHandler);
    fastify.get('testnet/evmFaucet/:evmAddress', evmFaucetOpts, evmFaucetHandler);
    fastify.get('testnet/zkEvmFaucet/:evmAddress', zkEvmFaucetOpts, zkEvmFaucetHandler);
    fastify.post('testnet/account', accountOpts, accountHandler);
};
