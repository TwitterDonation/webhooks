const firebaseAdmin = require('firebase-admin')
const functions = require('firebase-functions')
const paypal = require('paypal-rest-sdk')

const config = functions.config()
const app = firebaseAdmin.initializeApp()
const db = app.firestore()

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
    if (json.event_type != 'PAYMENTS.PAYMENT.CREATED') {
        response.sendStatus(404)
        return
    }

    const paymentId = json.resource.id
    const payerId = json.resource.payer.payer_info.payer_id
    try {
        const payment = await executePayment(paymentId, payerId)
        if (payment.httpStatusCode !== 200) {
            response.status(500).send('Could not execute transaction')
            return
        }

        const payerId = payment.payer.payer_info.payer_id
        const sale = payment.transactions[0].related_resources[0].sale
        const currency = sale.amount.currency
        const total = parseFloat(sale.amount.total)
        const fees = parseFloat(sale.transaction_fee.value)
        try {
            await updateUserBalance(payerId, currency, total, fees)
            response.status(200).end()
        } catch(error) {
            response.status(500).send(error)
        }
    } catch(error) {
        response.status(500).send(error)
    }
}
