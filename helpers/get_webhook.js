const request = require('request')
require('dotenv').config()

const request_options = {
    url: 'https://api.twitter.com/1.1/account_activity/all/webhooks.json',
    oauth: {
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        token: process.env.TWITTER_TOKEN,
        token_secret: process.env.TWITTER_TOKEN_SECRET
    },
    headers: {
        'Content-type': 'application/x-www-form-urlencoded'
    }
}

request.get(request_options, (error, response, body) => {
    console.log(body)
})
