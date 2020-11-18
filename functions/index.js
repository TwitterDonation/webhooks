const express = require('express')
const bodyParser = require('body-parser')
const functions = require('firebase-functions')

const app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.get('/', require('./controllers/verification'))
app.post('/', require('./controllers/events'))

exports.twitterWebhook = functions.https.onRequest(app)

// process.env.twitter.app_id
// process.env.twitter.api_key
// process.env.twitter.api_key_secret
// process.env.twitter.access_token
// process.env.twitter.access_token_secret
