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

export const paymentSubscription = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const { email, paymentMethod } = request.body;
        const connection = await connect();
        const repo = connection.getRepository(Users);

        let user = await repo.findOne({email: email});

        const customer = await stripe.customers.create({
            payment_method: paymentMethod,
            email: email,
            invoice_settings: {
                default_payment_method: paymentMethod,
            },
        });

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [
                {price: 'price_1IHZKzAT9ya87fpT4uf93joS'},
            ],
        });

        user.payment = {subscriptionID: subscription['id']}

        await repo.save(user);

        const status = subscription['status'];
        const client_secret = subscription['client_secret'];

        response.send({'client_secret': client_secret, 'status': status})
    })
})

export const updatePaymentDetails = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        //const { cardDetails } = request.body;


    })
})

export const cancelSubscription = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const { id } = request.body;
        const connection = await connect();
        const repo = connection.getRepository(Users);

        let user = await repo.findOne({id: id});
        const {subscriptionID} = user.payment;

        const deleted = await stripe.subscriptions.del(subscriptionID);

        if (deleted.status === 'canceled') {
            user.payment = {
                ...user.payment,
                cancelled: true
            }
            await repo.save(user);
        }

        response.send(deleted)
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

        const intent:any = event.data.object;

        switch (event.type) {
            case 'payment_intent.succeeded':
                const connection = await connect();
                const repoUsers = connection.getRepository(Users);

                let user = await repoUsers.findOne({email: intent.charges.data[0].billing_details.email});

                user.payment = {
                    ...user.payment,
                    id: intent.id,
                    created: intent.created,
                    amount: intent.amount,
                    subscription: new Date(moment().add(35, 'days').format('YYYY/MM/DD'))
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
