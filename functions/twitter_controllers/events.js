const re = new RegExp(/^@DonationBot (?<currency>[\$\€\£])(?<amount>\d+) @\S+$/)
const currencyMap = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GPB'
}

module.exports = (request, response) => {
    const json = request.body
    if (json.tweet_create_events) {
        const object = json.tweet_create_events
        const accounts = object.entities.user_mentions
        if (accounts.length !== 2) {
            // error tweet: two many / not enough recipients
            response.sendStatus(200)
            return
        }

        const ids = accounts.filter(acc => acc.id_str !== json.for_user_id)
        const recipientId = ids.pop()
        if (ids.length > 0 || !recipientId || recipientId == object.user.id_str) {
            // error tweet: cannot donate to @DonationBot or to user itself
            response.sendStatus(200)
            return
        }

        const matches = re.exec(object.text)
        if (!matches) {
            // error tweet: wrong tweet formatting
            response.sendStatus(200)
            return
        }

        const amount = matches.groups.amount
        const currency = currencyMap[matches.groups.currency]
        // Paypal: transfer `amount` of `currency` to `recipientId`
        response.sendStatus(200)
    } else {
        response.sendStatus(200)
    }
}
