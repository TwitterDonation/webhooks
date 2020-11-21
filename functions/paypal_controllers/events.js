const functions = require('firebase-functions')
const firebaseAdmin = require('firebase-admin')
const paypal = require('paypal-rest-sdk')

let app;
try { app = firebaseAdmin.app() } catch { app = firebaseAdmin.initializeApp() }
const db = app.firestore()
const config = functions.config()

paypal.configure({
    'mode': 'live',
    'client_id': config.paypal.client_id,
    'client_secret': config.paypal.client_secret
})

const executePayment = async (paymentId, payerId) => {
    const data = {payer_id: payerId}
    return new Promise((resolve, reject) => {
        paypal.payment.execute(paymentId, data, (error, payment) => {
            if (error) {
                reject(error)
            } else {
                resolve(payment)
            }
        })
    })
}

const updateUserBalance = async (userId, currency, total, fees) => {
    const ref = db.collection('users').doc(userId)
    return ref.get()
        .then(doc => {
            // TODO: currency conversion
            const data = doc.data()
            const currentBalance = data.balance ? data.balance : 0
            return parseFloat((currentBalance + total - fees).toFixed(10))
        })
        .then(newBalance => {
            return ref.set({
                balance: newBalance,
                currency: currency
            }, {merge: true})
        })
}

module.exports = async (request, response) => {
    const json = request.body
    if (json.event_type !== 'PAYMENTS.PAYMENT.CREATED') {
        response.sendStatus(404)
        return
    }

    functions.logger.log(json)

    const paymentId = json.resource.id
    const payerId = json.resource.payer.payer_info.payer_id
    try {
        const payment = await executePayment(paymentId, payerId)
        if (payment.httpStatusCode !== 200) {
            response.sendStatus(404)
            functions.logger.error('Could not execute payment', payment)
            return
        }

        const sale = payment.transactions[0].related_resources[0].sale
        const currency = sale.amount.currency
        const total = parseFloat(sale.amount.total)
        const fees = parseFloat(sale.transaction_fee.value)
        await updateUserBalance(payerId, currency, total, fees)
        response.sendStatus(200)
    } catch(error) {
        response.status(500).send(error)
        functions.logger.error(error)
    }
}
