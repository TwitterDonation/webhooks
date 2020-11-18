const crypto = require('crypto')
const config = require('firebase-functions').config()

module.exports = (request, response) => {
    const crc = request.query.crc_token
    if (crc) {
        const hmac = crypto.createHmac('sha256', twitter.api_key_secret).update(crc).digest('base64')
        response.status(200).send({response_token: 'sha256=' + hmac})
    } else {
        console.error("crc_token missing from request.")
        response.sendStatus(400)
    }
}
