const functions = require('firebase-functions')
const paypal = require('paypal-rest-sdk')
const config = functions.config()

paypal.configure({
    'mode': 'live',
    'client_id': config.paypal.client_id,
    'client_secret': config.paypal.client_secret
})

const createPayment = async (currency, amount) => {
    const options = {
        'intent': 'sale',
        'payer': {
            'payment_method': 'paypal'
        },
        'redirect_urls': {
            'return_url': 'https://aflak.me',
            'cancel_url': 'https://aflak.me'
        },
        'transactions': [{
            'amount': {
                'currency': currency,
                'total': amount
            },
            'description': 'Twitter #Codechella 2020'
        }]
    }

    return new Promise((resolve, reject) => {
        paypal.payment.create(options, (error, payment) => {
            if (error) {
                reject(error)
            } else {
                for (var index = 0; index < payment.links.length; index++) {
                    if (payment.links[index].rel === 'approval_url') {
                        resolve(payment.links[index].href)
                        return
                    }
                }
                resolve(null)
            }
        })
    })
}

module.exports = async (request, response) => {
    const currency = request.query.currency
    const amount = request.query.amount
    try {
        const link = await createPayment()
        response.status(200).send({link})
    } catch(error) {
        response.status(500).send(error)
    }
}
