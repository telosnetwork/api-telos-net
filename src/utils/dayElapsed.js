function dayElapsed(epochTime){
    const ONE_DAY = 86400;
    timePassed = ((Date.now() - epochTime))
    
    return ((timePassed- ONE_DAY) < 0)
}

module.exports = { dayElapsed };
