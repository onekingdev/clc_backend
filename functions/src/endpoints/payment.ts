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
import { stripe_env, runtimeOpts } from "../config";
import { ActivationCodes } from "../entities/ActivationCodes";
import {applyMiddleware} from "../middleware"
import {newPaymentOperateEvent} from "../helpers/event"

// @ts-ignore
const stripe = new Stripe(
  process.env.NODE_ENV == "production" ? 
  process.env.STRIPE_PRODUCTION_KEY
  : process.env.STRIPE_DEVELOPMENT_KEY
);
export const paymentIntent = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
      const { items } = request.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(items),
        currency: "usd",
        statement_descriptor_suffix: 'CLAI',
      });
      response.send({ clientSecret: paymentIntent.client_secret });
    });
  }
);

export const paymentSubscription = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
      const { email, paymentMethod, subscriptionType, reactivate } = request.body;
      if(reactivate) 
        paymentMethod.card={
          brand: paymentMethod.brand,
          exp_month: paymentMethod.expMonth,
          exp_year: paymentMethod.expYear,
          last4: paymentMethod.last4,
        }
      
      const connection = await connect();

      const repo = connection.getRepository(Users);
      const codes = connection.getRepository(ActivationCodes);

      let user = await repo.findOne({ email: email });
      let code = await codes.findOne({ id: user.activationCodeID });
      let customer;
      try{
        customer = await stripe.customers.create({
          payment_method: paymentMethod.id,
          email: email,
          invoice_settings: {
            default_payment_method: paymentMethod.id,
          },
        });
      } catch (err) {
        if(reactivate) customer = {id:user.payment.customerID};
        else {
          response.send({ client_secret: null, status: "invalid_creditcard" });
          return;
        }
      } 
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customer.id,
      }).catch(console.log);
    /*--------------- delete last payment -S-------------------------------------------------*/
      if(user.payment.customerID && user.payment.canceled !== true) {
        stripe.customers.del(user.payment.customerID)
        newPaymentOperateEvent(user.email, "delete_customer", 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscription)
      }
      
    /*--------------- delete last payment -E-------------------------------------------------*/

      let subscription;
      console.log("user.payment.canceled ", user.payment.canceled )
      if (code.trailDays > 0 && user.payment.canceled == null) {

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
            trial_period_days: code.trailDays,
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
            code.trailDays > 0 && user.payment.canceled == null
              ? new Date(moment().add(code.trailDays, "days").format("YYYY/MM/DD"))
              : new Date(moment().add(30, "days").format("YYYY/MM/DD")),
          subscriptionType: subscriptionType,
          paymentMethod: {
            id: paymentMethod.id,
            brand: paymentMethod.card.brand,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
            last4: paymentMethod.card.last4,
          },
          canceled: false
        };
      } else {
        response.send({ client_secret: null, status: "error" });
      }
      await repo.save(user);

      const status = subscription["status"];
      const client_secret = subscription["client_secret"];
      
      newPaymentOperateEvent(user.email, reactivate ? "new_subscription_reactivate" : "new_subscription", 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscription)

      response.send({ client_secret: client_secret, status: status });
    });
  }
);

export const updatePaymentDetails = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
      
      const { id, newPaymentMethod } = request.body;
      const connection = await connect();
      const repo = connection.getRepository(Users);

      let user = await repo.findOne({ id: id });
      const { customerID, paymentMethod } = user.payment;
      // try {
      let isAttachSuccess = true;
      let isUpdateSuccess = true;
      /*--------------- add new payment method to payments method list in stripe -S----------------------*/
      const res = await stripe.paymentMethods.attach(newPaymentMethod.id, {
        customer: customerID,
      }).catch(e => {
        console.log("=============attach failed================");
        isAttachSuccess = false;
        console.log(e.raw);
        response.send({success:false, message:e.raw.message})
      });
      /*--------------- add new payment method to payments method list in stripe -E----------------------*/
      console.log("isAttach Success", isAttachSuccess);
      if(!isAttachSuccess) return;

      /*--------------- upgrade paymentmenthod to  new payment method for customer -S----------------------*/
      stripe.customers.update(customerID,{
        invoice_settings : {
          default_payment_method: newPaymentMethod.id
        }
      }).catch(e=> {
        isUpdateSuccess = false;
        response.send({success:false, message:e.raw.message})

      })
      /*--------------- upgrade paymentmenthod to  new payment method for customer -E----------------------*/

      if(!isUpdateSuccess) return;

      /*--------------- delete old paymentmenthod from payments method list in stripe -S----------------------*/
      await stripe.paymentMethods.detach(paymentMethod.id);
      /*--------------- delete old paymentmenthod from payments method list in stripe -E----------------------*/

      /*--------------- cancel last payment -S-------------------------------------------------*
      const { subscriptionID } = user.payment;
      if(!user.payment.canceled) {
        await stripe.subscriptions.update(subscriptionID,{
          cancel_at_period_end: true
        })
      }
      /*--------------- cancel last payment -E-------------------------------------------------*/

      /*--------------- upgrade payment method in database -S------------------------------*/
      const paymentDetails = {
        id: newPaymentMethod.id,
        brand: newPaymentMethod.card.brand,
        expMonth: newPaymentMethod.card.exp_month,
        expYear: newPaymentMethod.card.exp_year,
        last4: newPaymentMethod.card.last4,
      };
      /*--------------- upgrade payment method in database -E------------------------------*/

      user.payment.paymentMethod = paymentDetails;
      await repo.save(user);
      newPaymentOperateEvent(user.email, "update_paymentMethod", 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscription)
      response.send({success: true,data:res});

    });
  }
);

export const cancelSubscription = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
      try{
        const { id } = request.body;
        const connection = await connect();
        const repo = connection.getRepository(Users);

        let user = await repo.findOne({ id: id });
        const { subscriptionID } = user.payment;
        // const subscriptionID = "sub_1Jz44lAT9ya87fpT3lFGFF9o";

        // const deleted = await stripe.subscriptions.del(subscriptionID);

        // if (deleted.status === "canceled") {
        //   user.payment = {
        //     ...user.payment,
        //     canceled: true,
        //   };
        //   await repo.save(user);
        // }
        // response.send(deleted);
        const canceled = await stripe.subscriptions.update(subscriptionID,{
          cancel_at_period_end: true
        })
        let currentPeriodEnd = new Date(canceled.current_period_end * 1000);
        if(canceled.cancel_at_period_end) {
          user.payment = {
                ...user.payment,
                canceled: true,
                subscription: currentPeriodEnd,
              };
          await repo.save(user);
        }
        newPaymentOperateEvent(user.email, "cancel_subscription", 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscription)
        response.send({success: true,data:canceled});
      } catch(err) {
        response.send({success:false, message:err.raw.message})
      } 
    });
  }
);

export const reActiveSubscription = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
     
      try{
        const { id } = request.body;
        const connection = await connect();
        const repo = connection.getRepository(Users);
  
        let user = await repo.findOne({ id: id });
        const { subscriptionID } = user.payment;
        const updatedSubscription = await stripe.subscriptions.update(subscriptionID,{
          cancel_at_period_end: false
        })
        let currentPeriodEnd = new Date(updatedSubscription.current_period_end * 1000);
        if(!updatedSubscription.cancel_at_period_end) {
          user.payment = {
                ...user.payment,
                canceled: false,
                subscription: currentPeriodEnd,
              };
          await repo.save(user);
        }
        response.send({success: true,data:updatedSubscription});
        newPaymentOperateEvent(user.email, "reactivate_canceled_subscription", 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscription)
      } catch(err) {
        response.send({success:false, message:err.raw.message})
      }
    });
  }
);

export const stripeHook = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
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
        response.send({ status: "error" });
        return;
      }

      const intent: any = event.data.object;
      let subscriptionFinishDate = new Date("0000-00-00");

      switch (event.type) {
        case "payment_intent.succeeded":
          const connection = await connect();
          const repoUsers = connection.getRepository(Users);

          let user = await repoUsers.findOne({
            email: intent.charges.data[0].billing_details.email,
          });
          if(!user) {
            response.send({ status: "error", message: "Current user was deleted on database" });
            return;
          }
          
          const payment = {
            ...user.payment,
            id: intent.id,
            created: intent.created,
            amount: intent.amount,
            subscription: new Date(
              moment().add(30, "days").format("YYYY/MM/DD")
            ),
          };

          subscriptionFinishDate = payment.subscription;

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
      
      newPaymentOperateEvent(intent.charges.data[0].billing_details.email, event.type, intent.amount, intent.amount_captured, intent.charges.data[0].paymentMethod, intent.charges.data[0].customer, subscriptionFinishDate)
      
      response.send({ status: "success" });
    }, false);
  }
);
