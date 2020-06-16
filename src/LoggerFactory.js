const pino = require('pino')
const devMode = process.env.MODE == 'dev'

if (devMode)
    require('pino-pretty')

function create(source) {
    const logLevel = process.env.API_LOG_LEVEL || 'info'
    console.log(`Creating logger for ${source} ${devMode ? ' in dev mode ' : ''} with level ${logLevel}`)
    let options = {
        level: logLevel,
        name: source
    }

    if (devMode)
        options.prettyPrint = { colorize: true }

    return pino(options)
}

module.exports = { create }