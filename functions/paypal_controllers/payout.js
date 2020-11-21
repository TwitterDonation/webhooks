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

const makePayPalTransfer = async (senderPayPalId, recipientPayPalId, currency, amount) => {
    // TODO: PayPal transfer
    // The way it is setup we won't use `senderPayPalId`, since we're going
    // to transfer money from the bot account to the `recipientPayPalId`
    // PayPal is verifying our bank details, calling the API won't work for now...
    // we'll just `return true` and pretend it's done.
    return true
}

module.exports = async (senderTwitterId, recipientTwitterId, currency, amount) => {
    return db.collection('users').where('twitter_id', 'in', [senderTwitterId, recipientTwitterId]).get()
    .then(snapshot => {
        const docs = snapshot.docs
        if (docs.length !== 2) {
            return Promise.reject(-1)
        }
        const senderDoc = docs[0].data().twitter_id == senderTwitterId ? docs[0] : docs[1]
        const recipientDoc = docs[0].data().twitter_id == senderTwitterId ? docs[1] : docs[0]
        return {senderDoc, recipientDoc}
    })
    .then(docs => {
        // TODO: currency conversion
        const senderData = docs.senderDoc.data()
        const senderBalance = senderData.balance ? senderData.balance : 0
        if (senderBalance < amount) {
            return Promise.reject(-2)
        }

        return makePayPalTransfer(docs.senderDoc.id, docs.recipientDoc.id, currency, amount)
        .then(result => {
            const senderNewBalance = parseFloat((senderBalance - amount).toFixed(10))
            return db.collection('users').doc(docs.senderDoc.id).set({
                balance: senderNewBalance,
                currency: currency
            }, {merge: true}).then(result => {
                const recipientData = docs.recipientDoc.data()
                const recipientBalance = recipientData.balance ? recipientData.balance : 0
                const recipientNewBalance = parseFloat((recipientBalance + amount).toFixed(10))
                return db.collection('users').doc(docs.recipientDoc.id).set({
                    balance: recipientNewBalance,
                    currency: currency
                }, {merge: true})
            })
        })
    })
}
