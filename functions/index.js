const express = require('express')
const bodyParser = require('body-parser')
const functions = require('firebase-functions')

const app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.get('/twitter', require('./twitter_controllers/crc'))
app.post('/twitter', require('./twitter_controllers/events'))

app.get('/paypal', require('./paypal_controllers/create_payment'))
app.post('/paypal', require('./paypal_controllers/events'))

exports.webhook = functions.https.onRequest(app)
