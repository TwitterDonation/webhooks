const functions = require('firebase-functions')

module.exports = (request, response) => {
    functions.logger.log('Event:', request.body)
    response.status(200).end()
}
