// @ts-ignore
import Stripe from "stripe";
// import {connect} from "../config";
import * as functions from "firebase-functions";
import { calculateOrderAmount } from "../helpers/parser";
import { Users } from "../entities/Users";
import { connect } from "../config";
import moment = require("moment");
import { sendSubscriptionEmail } from "../mail/payment";
import { getStripeKey } from "../services/stripe";
import { stripe_env } from "../config";

const cors = require("cors")({ origin: true });

// @ts-ignore
const stripe = new Stripe(
  "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"
);
export const paymentIntent = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const { items } = request.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(items),
        currency: "usd",
      });
      response.send({ clientSecret: paymentIntent.client_secret });
    });
  }
);

export const paymentSubscription = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const { email, paymentMethod, subscriptionType } = request.body;
      const connection = await connect();
      const repo = connection.getRepository(Users);

      let user = await repo.findOne({ email: email });

      const customer = await stripe.customers.create({
        payment_method: paymentMethod.id,
        email: email,
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customer.id,
      });

      // const today = new Date();
      // const firstPaymentDate = new Date(today.getFullYear(),today.getMonth() + 3,today.getDay());

      // const futureMonth = moment().add(3, 'M').format('DD-MM-YYYY').unix();

      let subscription;

      if (user.type === "closer") {
        subscription = await stripe.subscriptions
          .create({
            customer: customer.id,
            items: [
              {
                price: getStripeKey.subscription_price(
                  stripe_env,
                  subscriptionType
                ),
              },
            ],
            // trial_end: parseInt(`${new Date(futureMonth).getTime() / 1000}`)
            // trial_end: (Date.now() / 1000) + 7952400,
            trial_period_days: 90,
          })
          .catch((err) => response.send(err));
      } else {
        subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [
            {
              price: getStripeKey.subscription_price(
                stripe_env,
                subscriptionType
              ),
            },
          ],
        });
      }

      if (customer.id && subscription.id && paymentMethod.id) {
        user.payment = {
          customerID: customer.id,
          subscriptionID: subscription["id"],
          subscription:
            subscription.trial_end > 0
              ? new Date(moment().add(90, "days").format("YYYY/MM/DD"))
              : new Date(moment().add(35, "days").format("YYYY/MM/DD")),
          subscriptionType: subscriptionType,
          paymentMethod: {
            id: paymentMethod.id,
            brand: paymentMethod.card.brand,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
            last4: paymentMethod.card.last4,
          },
        };
      } else {
        response.send({ client_secret: null, status: "error" });
      }

      await repo.save(user);

      const status = subscription["status"];
      const client_secret = subscription["client_secret"];

      response.send({ client_secret: client_secret, status: status });
    });
  }
);

export const updatePaymentDetails = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const { id, newPaymentMethod } = request.body;
      const connection = await connect();
      const repo = connection.getRepository(Users);

      let user = await repo.findOne({ id: id });
      const { customerID, paymentMethod } = user.payment;

      await stripe.paymentMethods.detach(paymentMethod.id);

      const res = await stripe.paymentMethods.attach(newPaymentMethod.id, {
        customer: customerID,
      });

      const paymentDetails = {
        id: newPaymentMethod.id,
        brand: newPaymentMethod.card.brand,
        expMonth: newPaymentMethod.card.exp_month,
        expYear: newPaymentMethod.card.exp_year,
        last4: newPaymentMethod.card.last4,
      };

      user.payment.paymentMethod = paymentDetails;

      await repo.save(user);

      response.send(res);
    });
  }
);

export const cancelSubscription = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const { id } = request.body;
      const connection = await connect();
      const repo = connection.getRepository(Users);

      let user = await repo.findOne({ id: id });
      const { subscriptionID } = user.payment;

      const deleted = await stripe.subscriptions.del(subscriptionID);

      if (deleted.status === "canceled") {
        user.payment = {
          ...user.payment,
          canceled: true,
        };
        await repo.save(user);
      }

      response.send(deleted);
    });
  }
);

export const stripeHook = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const sig = request.headers["stripe-signature"];

      const endpointSecret = getStripeKey.hook_secret(stripe_env);

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          request.rawBody,
          sig,
          endpointSecret
        );
      } catch (err) {
        console.log(err);
        response.send({ status: "error" });
        return;
      }

      const intent: any = event.data.object;

      switch (event.type) {
        case "payment_intent.succeeded":
          const connection = await connect();
          const repoUsers = connection.getRepository(Users);

          let user = await repoUsers.findOne({
            email: intent.charges.data[0].billing_details.email,
          });

          const payment = {
            ...user.payment,
            id: intent.id,
            created: intent.created,
            amount: intent.amount,
            subscription: new Date(
              moment().add(35, "days").format("YYYY/MM/DD")
            ),
          };

          user.payment = payment;

          await repoUsers.save(user);

          sendSubscriptionEmail(intent.charges.data[0].billing_details.email);

          break;
        case "payment_intent.payment_failed":
          const message =
            intent.last_payment_error && intent.last_payment_error.message;
          console.log("Failed:", intent.id, message);
          break;
      }

      response.send({ status: "success" });
    });
  }
);
