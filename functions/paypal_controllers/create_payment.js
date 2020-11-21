const functions = require('firebase-functions')
const firebaseAdmin = require('firebase-admin')
const paypal = require('paypal-rest-sdk')
const config = functions.config()

let app;
try { app = firebaseAdmin.app() } catch { app = firebaseAdmin.initializeApp() }
const db = app.firestore()

paypal.configure({
    'mode': 'live',
    'client_id': config.paypal.client_id,
    'client_secret': config.paypal.client_secret
})

const createPayment = async (currency, amount, returnUrl, cancelUrl) => {
    const options = {
        'intent': 'sale',
        'payer': {
            'payment_method': 'paypal'
        },
        'redirect_urls': {
            'return_url': returnUrl,
            'cancel_url': cancelUrl
        },
        'transactions': [{
            'amount': {
                'currency': currency,
                'total': amount
            },
            'description': 'Twitter #Codechella 2020'
        }],
        'application_context': {
            'shipping_preference': 'NO_SHIPPING'
        }
    }

    return new Promise((resolve, reject) => {
        paypal.payment.create(options, (error, payment) => {
            if (error) {
                reject(error)
            } else {
                for (var index = 0; index < payment.links.length; index++) {
                    if (payment.links[index].rel === 'approval_url') {
                        resolve({
                            paymentId: payment.id,
                            link: payment.links[index].href
                        })
                        return
                    }
                }
                resolve(null)
            }
        })
    })
}

const registerUserForLater = async (paymentId, twitterId) => {
    return db.collection('payments').doc(paymentId).set({
        twitter_id: twitterId
    }, {merge: true})
}

module.exports = async (request, response) => {
    try {
        const currency = request.query.currency
        const amount = request.query.amount
        const returnUrl = request.query.return_url
        const cancelUrl = request.query.cancel_url
        const twitterId = request.query.twitter_id
        const {paymentId, link} = await createPayment(currency, amount, returnUrl, cancelUrl)
        await registerUserForLater(paymentId, twitterId)
        response.status(200).send({link})
    } catch(error) {
        response.status(500).send(error)
        functions.logger.error(error)
    }
}
