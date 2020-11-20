const request = require('request')
const functions = require('firebase-functions')

const config = functions.config()
const re = new RegExp(/^@make_donation (?<currency>[\$\€\£])(?<amount>\d+) @\S+$/)
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

            const accounts = object.entities.user_mentions
            const senderScreenName = object.user.screen_name
            if (accounts.length !== 2) {
                try {
                    const msg = `@${senderScreenName} You need to specify a (single) recipient! ✨`
                    await tweetReply(msg, object.id_str)
                } catch (error) {
                    functions.logger.log(error)
                } finally {
                    response.sendStatus(200)
                    continue
                }
            }

            const ids = accounts.filter(acc => acc.id_str !== botId)
            const recipientId = ids.pop()
            if (ids.length > 0 || !recipientId || recipientId == object.user.id_str) {
                try {
                    const msg = `@${senderScreenName} You cannot donate to me or to yourself... 😭`
                    await tweetReply(msg, object.id_str)
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
                    await tweetReply(msg, object.id_str)
                } catch (error) {
                    functions.logger.log(error)
                } finally {
                    response.sendStatus(200)
                    continue
                }
            }

            const amount = matches.groups.amount
            const currency = currencyMap[matches.groups.currency]
            try {
                // Paypal: transfer `amount` of `currency` to `recipientId`
                const msg = `@${senderScreenName} You just donated! 💸👌🎉✨❤`
                await tweetReply(msg, object.id_str)
            } catch (error) {
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
