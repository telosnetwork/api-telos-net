const crypto = require('crypto');
async function hash (data) {
    var shasum = crypto.createHash('sha256');
    shasum.update(data);
    return shasum.digest('hex');
}

module.exports = { hash }