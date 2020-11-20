const functions = require('firebase-functions')
const config = functions.config()

const re = new RegExp(/^@DonationBot \$(?<amount>\d+) @\S+$/)
const currencyMap = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GPB'
}

module.exports = (request, response) => {
    const json = request.body
    functions.logger.log(json)
    if (json.tweet_create_events) {
        const object = json.tweet_create_events
        const accounts = object.entities.user_mentions
        if (accounts.length == 2) {
            const ids = accounts.filter(acc => acc.id_str !== json.for_user_id)
            const recipientId = ids.pop()
            if (ids.length == 0 && recipientId != object.user.id_str) {
                const matches = re.exec(object.text)
                if (matches) {
                    const amount = matches.groups.amount
                    const currency = currencyMap[matches.groups.currency]
                    // Paypal: transfer `amount` of `currency` to `recipientId`
                } else {
                    // error tweet: wrong formatting
                }
            } else {
                // error tweet: cannot donate to @DonationBot or to user itself
            }
        } else {
            // error tweet: two many recipients
        }
    } else {
        response.status(200).end()
    }
}
