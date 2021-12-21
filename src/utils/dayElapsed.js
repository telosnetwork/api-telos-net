function dayElapsed(epochTime){
    const ONE_DAY = 86400000;
    timeElapsed = ((Date.now() - epochTime))

    return (timeElapsed > ONE_DAY)
}

module.exports = { dayElapsed };
