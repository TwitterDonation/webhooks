const crypto = require('crypto')
const API_KEY_SECRET = require('firebase-functions').config().twitter.api_key_secret

module.exports = (request, response) => {
    const crc = request.query.crc_token
    if (crc) {
        const hmac = crypto.createHmac('sha256', API_KEY_SECRET).update(crc).digest('base64')
        response.status(200).send({response_token: 'sha256=' + hmac})
    } else {
        console.error("crc_token missing from request.")
        response.sendStatus(400)
    }
}
