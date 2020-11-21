# Twitter Donation Webhooks

This repository contains the code for serverless functions hosted on Firebase that are triggered by the Twitter Account Activity API and by the PayPal API.

The bot listens for *@mentions* with the correct message formatting then transfers funds using the PayPal API.

```
firebase functions:config:set twitter.consumer_key="CONSUMER_KEY"
firebase functions:config:set twitter.consumer_secret="CONSUMER_SECRET"
firebase functions:config:set twitter.token="TOKEN"
firebase functions:config:set twitter.token_secret="TOKEN_SECRET"
firebase functions:config:set paypal.client_id="CLIENT_ID"
firebase functions:config:set paypal.client_secret="CLIENT_SECRET"
firebase deploy --only functions
```
