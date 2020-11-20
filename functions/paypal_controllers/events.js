const functions = require('firebase-functions')
const paypal = require('paypal-rest-sdk')
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

module.exports = async (request, response) => {
    const json = request.body
    if (json.event_type == 'PAYMENTS.PAYMENT.CREATED') {
        const paymentId = json.resource.id
        const payerId = json.resource.payer.payer_info.payer_id
        try {
            const payment = await executePayment(paymentId, payerId)
            response.status(200).send(payment)
        } catch(error) {
            response.status(500).send(error)
        }
    } else {
        response.sendStatus(403)
    }
}
