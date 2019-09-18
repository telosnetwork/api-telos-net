
export async function hash (data) {
    var crypto = require('crypto');
    var shasum = crypto.createHash('sha256');
    shasum.update(data);
    return shasum.digest('hex');
}