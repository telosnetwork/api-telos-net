const dynamoDbLib = require("../libs/dynamodb-lib");
const sendLib = require("../libs/send-lib");
const cryptoLib = require("../libs/crypto-lib");
const Sentry = require('@sentry/node');
const { VoipError } = require('../libs/voip-error');
const eosioLib = require("../libs/eosio-lib");
const axios = require("axios");

const CURRENT_VERSION = "v0.1.1";

const registrationOpts = {
    schema: {
        tags: ['accounts'],
        body: {
            required: ['smsNumber'],
            type: 'object',
            properties: {
                smsNumber: {
                    description: 'SMS number to send the registration code',
                    type: 'string',
                    example: '800-555-1212'
                },
                telosAccount: {
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
            204: {
                description: 'Registration successful',
                type: 'null'
            },
            400: {
                description: 'Registration error',
                type: 'string'
            }
        }
    }
}

async function registrationHandler(request, reply) {
    Sentry.init({ dsn: process.env.sentryDsn });
    Sentry.configureScope(scope => scope.setExtra('Request Body', request.body));

    try {
        const smsNumber = await sendLib.cleanNumberFormat(request.body.smsNumber);
        const smsHash = await cryptoLib.hash(smsNumber);
        let record = {};

        if (await dynamoDbLib.exists(smsHash)) {
            record = await dynamoDbLib.getBySmsHash(smsHash);
            if (record.accountCreatedAt > 0) {
                request.log.info(`Already got Telos account, record is ${JSON.stringify(record, null, 4)}`)
                return reply.code(403).send(`This SMS number ${smsNumber} has already received a free Telos account via this service. Use SQRL or another wallet to create another account.`);
            }
        }

        if (request.body.telosAccount) {
            if (!eosioLib.validAccountFormat(request.body.telosAccount)) {
                return reply.code(400).send(`Requested Telos account name (${request.body.telosAccount}) is not a valid format. It must match ^([a-z]|[1-5]|[\.]){1,12}$`);
            }
            if (await eosioLib.accountExists(request.body.telosAccount)) {
                return reply.code(400).send(`Requested Telos account name (${request.body.telosAccount}) already exists.`);
            }
            record.telosAccount = request.body.telosAccount;
        }

        if (request.body.activeKey) { record.activeKey = request.body.activeKey; }
        if (request.body.ownerKey) { record.ownerKey = request.body.ownerKey; }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const msg = await sendLib.sendSMS(smsNumber, otp);

        record.smsHash = smsHash;
        record.smsOtp = otp;
        record.smsSid = msg.sid;
        record.version = CURRENT_VERSION;

        await dynamoDbLib.save(record);

        reply.code(204);
    } catch (e) {
        Sentry.captureException(e);
        await Sentry.flush(2500);
        request.log.error(e)
        if (e instanceof VoipError || e.name === 'VoipError') {
            reply.code(401).send(e.message);
        }
        reply.code(500).send(e.message);
    }
}

const createOpts = {
    schema: {
        tags: ['accounts'],
        body: {
            required: ['smsNumber', 'smsOtp'],
            type: 'object',
            properties: {
                smsNumber: {
                    description: 'SMS number to send the registration code',
                    type: 'string',
                    example: '800-555-1212'
                },
                smsOtp: {
                    description: 'One Time Password code sent via SMS',
                    type: 'number',
                    example: '123456'
                },
                sendPrivateKeyViaSms: {
                    description: '"Y" - yes or "N" - no, send the private key via SMS, only valid if generateKeys is also Y',
                    type: 'string',
                    example: 'Y'
                },
                generateKeys: {
                    description: '"Y" - yes or "N" - no, generate private keys',
                    type: 'string',
                    example: 'Y'
                },
                telosAccount: {
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
                description: 'Registration successful',
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        description: 'Result message',
                    },
                    result: {
                        type: 'object',
                        description: 'Transaction result from eosjs'
                    },
                    keyPair: {
                        type: 'object',
                        description: 'If generateKeys was Y then this will be the keypair used for the account',
                        properties: {
                            publicKey: {
                                type: 'string'
                            },
                            privateKey: {
                                type: 'string'
                            }
                        }
                    }
                }
            },
            400: {
                description: 'Creation error',
                type: 'string'
            },
            403: {
                description: 'This SMS number already received an account',
                type: 'string'
            }
        }
    }
}

async function createHandler(request, reply) {
    Sentry.init({ dsn: process.env.sentryDsn });
    Sentry.configureScope(scope => scope.setExtra('Request Body', request.body));

    const data = request.body;

    if ((data.sendPrivateKeyViaSms && data.sendPrivateKeyViaSms === "Y") &&
        (!data.generateKeys || data.generateKeys !== "Y")) {
        return reply.code(400).send("sendPrivateKeyViaSms parameter can only be used if generateKeys is set to Y");
    }

    try {
        const smsNumber = await sendLib.cleanNumberFormat(data.smsNumber);
        const smsHash = await cryptoLib.hash(smsNumber);

        const accountRecord = await dynamoDbLib.getBySmsHash(smsHash);

        if (!accountRecord) {
            return reply.code(403).send(`This SMS number ${smsNumber} has not been registered yet.`);
        }

        request.log.info(`ACCOUNT RECORD: ${JSON.stringify(accountRecord)}`);
        if (accountRecord.accountCreatedAt > 0) {
            return reply.code(403).send(`This SMS number ${smsNumber} has already received a free Telos account via this service. Use SQRL or another wallet to create another account.`);
        }

        let result, keyPair;
        if (data.smsOtp != accountRecord.smsOtp) {
            return reply.code(403).send(`The OTP provided does not match: ${data.smsOtp}. Permission denied.`);
        }

        if (data.telosAccount) {
            if (!eosioLib.validAccountFormat(data.telosAccount)) {
                return reply.code(400).send(`Requested Telos account name (${data.telosAccount}) is not a valid format. It must match ^([a-z]|[1-5]|[\.]){1,12}$`);
            }
            if (await eosioLib.accountExists(data.telosAccount)) {
                return reply.code(400).send(`Requested Telos account name (${data.telosAccount}) already exists.`);
            }
            accountRecord.telosAccount = data.telosAccount;
        }

        if (data.activeKey) { accountRecord.activeKey = data.activeKey; }
        if (data.ownerKey) { accountRecord.ownerKey = data.ownerKey; }

        let response = {};
        let message = `Telos account ${accountRecord.telosAccount} was created.`;

        if (data.generateKeys && data.generateKeys === "Y") {
            message = message + ` Key pair was generated by the service and NOT saved. See attached for keyPair used for owner and active.`;
            keyPair = await eosioLib.genRandomKey();
            accountRecord.activeKey = keyPair.publicKey;
            accountRecord.ownerKey = keyPair.publicKey;
            response.keyPair = keyPair;
        }

        if (!accountRecord.telosAccount) {
            return reply.code(400).send(`telosAccount is not available. This must be transmitted to either the register or create service. See API docs for more info.`);
        }
        if (!accountRecord.activeKey || !accountRecord.ownerKey) {
            return reply.code(400).send(`activeKey or ownerKey is not available. These must be transmitted to either the register or create service or transmit option generateKeys=Y. See API docs for more info.`);
        }
        result = await eosioLib.create(accountRecord.telosAccount, accountRecord.ownerKey, accountRecord.activeKey);

        if (data.sendPrivateKeyViaSms && data.sendPrivateKeyViaSms === "Y") {
            const msg = await sendLib.genSendSMS(smsNumber, `The private key for Telos account ${accountRecord.telosAccount} is ${keyPair.privateKey}. Ensure that you keep this safe.`);
            accountRecord.pkSid = msg.sid;
            message = message + ` Private key was also sent via SMS. SID: ${msg.sid}.`;
        }

        accountRecord.accountCreatedAt = Date.now();
        accountRecord.result = JSON.stringify(result);
        request.log.info("CREATE::MAIN:: Account record to save: ", JSON.stringify(accountRecord));
        await dynamoDbLib.save(accountRecord);

        response.message = message;
        response.result = result;
        return reply.code(200).send(response);
    } catch (e) {
        request.log.error(e)
        Sentry.captureException(e);
        await Sentry.flush(2500);
        return reply.code(500).send(e.message);
    }
}

const keygenOpts = {
    schema: {
        tags: ['accounts'],
        querystring: {
            numKeys: {
                default: 2,
                type: 'number'
            }
        }
    },
    response: {
        200: {
            description: 'Keygen response',
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'See attached keys'
                },
                keys: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            type: 'object',
                            description: 'Keypair',
                            properties: {
                                publicKey: {
                                    type: 'string'
                                },
                                privateKey: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

async function keygenHandler(request, reply) {
    Sentry.init({ dsn: process.env.sentryDsn });
    Sentry.configureScope(scope => scope.setExtra('Request Body', request.body));
    try {

        let numKeys = 2;
        if (request.query.numKeys) {
            numKeys = request.query.numKeys;
        }

        let keys = await eosioLib.genRandomKeys(numKeys);
        return reply.code(200).send({ message: `See attached keys`, keys: keys });
    } catch (e) {
        Sentry.captureException(e);
        await Sentry.flush(2500);
        return reply.code(500).send(e.message);
    }
}

const checkAccountOpts = {
    schema: {
        tags: ['accounts'],
        params: {
            type: 'object',
            properties: {
                'telosAccount': {
                    description: 'Account name to check',
                    type: 'string'
                }
            },
            required: ['telosAccount']
        },
        response: {
            204: {
                description: 'Account name valid and not already taken',
                type: 'null'
            },
            400: {
                description: 'Account check failure',
                type: 'string'
            }
        }
    }
}

async function checkAccountHandler(request, reply) {
    Sentry.init({ dsn: process.env.sentryDsn });
    Sentry.configureScope(scope => scope.setExtra('Request Body', request.body));

    try {
        if (!eosioLib.validAccountFormat(request.params.telosAccount)) {
            return reply.code(400).send(`Requested Telos account name ${request.params.telosAccount} is not a valid format. It must match ^([a-z]|[1-5]|[\.]){1,12}$`);
        }

        if (await eosioLib.accountExists(request.params.telosAccount)) {
            return reply.code(400).send(`Requested Telos account name ${request.params.telosAccount} already exists.`);
        }

        return reply.send(204);
    } catch (e) {
        Sentry.captureException(e);
        await Sentry.flush(2500);
        return reply.code(500).send(e.message);
    }
}

const recaptchaCreateOpts = {
    schema: {
        tags: ['accounts'],
        body: {
            required: ['accountName','activeKey','ownerKey', 'recaptchaResponse'],
            type: 'object',
            properties: {
                recaptchaResponse: {
                    description: 'Response code from the recaptcha API',
                    type: 'string',
                    example: ''
                },
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
            204: {
                description: 'Registration successful',
                type: 'null'
            },
            400: {
                description: 'Registration error',
                type: 'string'
            }
        }
    }
}

async function recaptchaCreateHandler(request, reply) {
    try {
        let accountName = request.body.accountName;
        let ownerKey = request.body.ownerKey;
        let activeKey = request.body.activeKey;
        let recaptchaResponse = request.body.recaptchaResponse;
        let ipAddress = request.ips.pop();

        let canCreate = await dynamoDbLib.ipCanCreate(ipAddress);
        if (canCreate) {
            let recaptchaResult = await axios.post(
                `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.recaptchaServerkey}&response=${recaptchaResponse}`,
                {},
                {
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
                  },
                },
              );

            if (!recaptchaResult.data.success) {
                request.log.info(`Recaptcha failure: ${JSON.stringify(recaptchaResult.data, null, 4)}`);
                return reply.code(403).send({
                    success: false,
                    message: `Recaptcha failure` 
                })
            }

            dynamoDbLib.ipCreated(ipAddress);
            result = await eosioLib.create(accountName, ownerKey, activeKey);
            return reply.send({
                success: true,
                result
            })
        } else {
            return reply.code(429).send({
                success: false,
                message: `IP Address ${ipAddress} cannot create any more accounts at this time`,
            })
        }
    } catch (e) {
        request.log.error(e)
        reply.code(500).send(e.message);
    }
}

const createRandomAccountOpts = {
    schema: {
        tags: ['accounts'],
        body: {
            required: ['activeKey','ownerKey'],
            type: 'object',
            description: 'Creates a randomly generated account and links to provided public keys',
            properties: {
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
        hide: true,
        response: {
            204: {
                description: 'Account generation and linked to public key(s) successful',
                type: 'null'
            },
            400: {
                description: 'Error generating account and linking to public keys',
                type: 'string'
            }
        }
    }
}

async function createRandomAccountHandler(request, reply) {
    try {
        const accountName = await eosioLib.generateRandomAccount();
        result = await eosioLib.create(accountName, request.body.ownerKey, request.body.activeKey);
        return reply.send({
            success: true,
            accountName
        })
    } catch (e) {
        request.log.error(e)
        reply.code(400).send(e.message);
    }
}



// Acount creation secured by google --------------------------------
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);


const create4GoogleOpts = {
    schema: {
        tags: ['accounts'],
        body: {
            required: ['jwt', 'ownerKey', 'activeKey'],
            type: 'object',
            properties: {
                jwt: {
                    type: 'string',
                    description: 'JWT token provided by Google after user authentication'
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
                },
                suggestedName: {
                    type: 'string',
                    description: 'Optional suggested name for the account',
                    example: 'examplename1'
                }
            }
        },
        response: {
            204: {
                description: 'Account generation and linked to public key(s) successful',
                type: 'null'
            },
            400: {
                description: 'Error generating account and linking to public keys',
                type: 'string'
            }
        }
    }
}

async function create4GoogleHandler(request, reply) {
    const { jwt, ownerKey, activeKey, suggestedName } = request.body;
    try {
        // Verificar el JWT con Google
        const ticket = await client.verifyIdToken({
            idToken: jwt,
        });
        if (!ticket) {
            throw new Error('Invalid JWT');
        }
        // Extract userId from the ticket
        const userId = ticket.getPayload()['sub'];


        // Check if account exists
        const existingAccount = await dynamoDbLib.getAccountNameForGoogleUser(userId);
        if (existingAccount) {
            return reply.send({ success: true, accountName: existingAccount });
        } else {
            // Generate the account name if not suggested
            const accountName = await eosioLib.generateRandomAccount(suggestedName);

            // Create the account and store in database
            const result = await eosioLib.create(accountName, ownerKey, activeKey);
            await dynamoDbLib.registerAccountNameForGoogleUser(userId, accountName);

            return reply.send({ success: true, accountName });
        }
    } catch (error) {
        // Enviar respuesta de error
        request.log.error(error)
        reply.code(400).send(error.message);
    }
}

// ------------------------------------------------------------------


async function accountsEndpointVersion(request, reply) {
    return reply.send({ success: true, version: CURRENT_VERSION });
}

const endpointVersionOpts = {
    schema: {
        tags: ['accounts'],
        body: {
            required: [],
            type: 'object',
        },
        response: {
            204: {
                description: 'Endpoint version',
                type: 'null'
            },
            400: {
                description: 'Error',
                type: 'string'
            }
        }
    }
}


module.exports = async (fastify, options) => {
    fastify.post('registrations', registrationOpts, registrationHandler)
    fastify.post('accounts', createOpts, createHandler)
    fastify.post('recaptchaCreate', recaptchaCreateOpts, recaptchaCreateHandler)
    fastify.post('accounts/random', createRandomAccountOpts, createRandomAccountHandler);
    fastify.post('accounts/create4google', create4GoogleOpts, create4GoogleHandler);
    fastify.get('accounts/version', endpointVersionOpts, accountsEndpointVersion);

    fastify.get('keys', keygenOpts, keygenHandler)
    fastify.get('accounts/:telosAccount', checkAccountOpts, checkAccountHandler)
}