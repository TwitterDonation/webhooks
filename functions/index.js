const express = require('express')
const bodyParser = require('body-parser')
const functions = require('firebase-functions')

const app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.get('/twitter', require('./twitter_controllers/crc'))
app.post('/twitter', require('./twitter_controllers/events'))

app.get('/paypal/create', require('./paypal_controllers/create_payment'))
app.post('/paypal/events', require('./paypal_controllers/events'))

exports.webhooks = functions.https.onRequest(app)

// process.env.twitter.app_id
// process.env.twitter.api_key
// process.env.twitter.api_key_secret
// process.env.twitter.access_token
// process.env.twitter.access_token_secret
