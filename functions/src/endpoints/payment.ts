// @ts-ignore
import Stripe from "stripe";
// import {connect} from "../config";
import * as functions from "firebase-functions";
import {calculateOrderAmount} from "../helpers/parser";
import {Users} from "../entities/Users";
import {connect} from "../config";
import moment = require("moment");
import {sendSubscriptionEmail} from "../mail/payment";

const cors = require('cors')({origin: true});

// @ts-ignore
const stripe = new Stripe('sk_test_V09bhnBnCKBDwLD6gMha7WgG');

export const paymentIntent = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const { items } = request.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(items),
            currency: "usd"
        });
        response.send({clientSecret: paymentIntent.client_secret});
    })
})

export const stripeHook = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {

        const sig = request.headers['stripe-signature'];

        const endpointSecret = 'whsec_PN7zX0x2NB093oANjDH9MgifE6ApxYqW';

        let event;
        try {
            event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret);
        } catch (err) {
            console.log(err)
            response.send({status: 'error'});
            return;
        }

        // Handle Type of webhook

        const intent:any = event.data.object;

        switch (event.type) {
            case 'payment_intent.succeeded':
                const connection = await connect();
                const repoUsers = connection.getRepository(Users);

                let user = await repoUsers.findOne({email: intent.charges.data[0].billing_details.email});

                user.payment = {
                    id: intent.id,
                    created: intent.created,
                    amount: intent.amount,
                    subscription: new Date(moment().add(30, 'days').format('YYYY/MM/DD'))
                };

                await repoUsers.save(user);

                sendSubscriptionEmail(intent.charges.data[0].billing_details.email);

                break;
            case 'payment_intent.payment_failed':
                const message = intent.last_payment_error && intent.last_payment_error.message;
                console.log('Failed:', intent.id, message);
                break;
        }

        response.send({status: 'success'});
    })
})
