const crypto = require('crypto')
const config = require('firebase-functions').config()
const CONSUMER_SECRET = config.twitter.consumer_secret

module.exports = (request, response) => {
    const crc = request.query.crc_token
    if (crc) {
        const hmac = crypto.createHmac('sha256', CONSUMER_SECRET).update(crc).digest('base64')
        response.status(200).send({response_token: 'sha256=' + hmac})
    } else {
        response.sendStatus(400)
    }
}
