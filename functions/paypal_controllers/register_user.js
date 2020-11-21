const functions = require('firebase-functions')

let app;
try { app = firebaseAdmin.app() } catch { app = firebaseAdmin.initializeApp() }
const db = app.firestore()

module.exports = async (request, response) => {
    try {
        const paypalId = request.body.paypal_id
        const twitterId = request.body.twitter_id
        db.collection('users').doc(paypalId).set({
            twitter_id: twitterId
        }, {merge: true})
        response.sendStatus(200)
    } catch(error) {
        response.status(500).send(error)
        functions.logger.error(error)
    }
}
