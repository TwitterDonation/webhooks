const request = require('request')
const functions = require('firebase-functions')
const makePayout = require('../paypal_controllers/payout')
const config = functions.config()

// Only EUR is allowed for now, to avoid currency conversion...
const re = new RegExp(/^@make_donation (?<currency>[\€])(?<amount>\d+) @\S+$/)
const currencyMap = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GPB'
}

const tweetReply = async (status, in_reply_to_status_id) => {
    return new Promise((resolve, reject) => {
        const request_options = {
            url: 'https://api.twitter.com/1.1/statuses/update.json',
            oauth: {
                consumer_key: config.twitter.consumer_key,
                consumer_secret: config.twitter.consumer_secret,
                token: config.twitter.token,
                token_secret: config.twitter.token_secret
            },
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            },
            form: {
                status,
                in_reply_to_status_id
            }
        }

        request.post(request_options, (error, response, body) => {
            if (error) {
                reject(error)
            } else {
                resolve(body)
            }
        })
    })
}

module.exports = async (request, response) => {
    const json = request.body
    const botId = json.for_user_id
    functions.logger.log(json)

    if (json.tweet_create_events) {
        for (object of json.tweet_create_events) {
            if (botId === object.user.id_str) {
                continue
            }

            const tweetId = object.id_str

            const accounts = object.entities.user_mentions
            const senderScreenName = object.user.screen_name
            if (accounts.length !== 2) {
                try {
                    const msg = `@${senderScreenName} You need to specify a (single) recipient! ✨`
                    await tweetReply(msg, tweetId)
                } catch (error) {
                    functions.logger.log(error)
                } finally {
                    response.sendStatus(200)
                    continue
                }
            }

            const ids = accounts.map(acc => acc.id_str).filter(id => id !== botId)
            const recipientId = ids.pop()
            const senderId = object.user.id_str
            if (ids.length > 0 || !recipientId || recipientId == senderId) {
                try {
                    const msg = `@${senderScreenName} You cannot donate to me or to yourself... 😭`
                    await tweetReply(msg, tweetId)
                } catch (error) {
                    functions.logger.log(error)
                } finally {
                    response.sendStatus(200)
                    continue
                }
            }

            const matches = re.exec(object.text)
            if (!matches) {
                try {
                    const msg = `@${senderScreenName} Wrong Tweet formatting! 💥`
                    await tweetReply(msg, tweetId)
                } catch (error) {
                    functions.logger.log(error)
                } finally {
                    response.sendStatus(200)
                    continue
                }
            }

            const amount = parseFloat(matches.groups.amount)
            const currency = currencyMap[matches.groups.currency]
            try {
                await makePayout(senderId, recipientId, currency, amount)
                const msg = `@${senderScreenName} You just donated! 💸👌🎉✨❤`
                await tweetReply(msg, tweetId)
            } catch (error) {
                if (error === -1) {
                    await tweetReply(`@${senderScreenName} Could not find you or the recipient in our database... 😭`, tweetId)
                } else if (error === -2) {
                    await tweetReply(`@${senderScreenName} Not enough money... 😭`, tweetId)
                }
                functions.logger.log(error)
            } finally {
                response.sendStatus(200)
                continue
            }
        }
    } else {
        response.sendStatus(200)
    }
}
