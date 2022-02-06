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
import  { payment_action_intent_succeeded, 
          payment_action_intent_failed,
          payment_action_new_subscription,
          payment_action_new_subscription_reactivate,
          payment_action_cancel_subscription,
          payment_action_reactivate_canceled_subscription,
          payment_action_update_paymentMethod,
          payment_action_delete_customer,
          payment_action_subscription_create_error,
          payment_action_customer_create_error,
          payment_action_payment_attach_error,
          // payment_action_customer_payUpdate_error,
          payment_action_subscription_cancel_error,
          payment_action_subscription_reactive_error,
          payment_action_webhook_construct_error,
          payment_action_intent_userDeletedOnDatabase_error,
          payment_action_intent_subscriptionDeletedOnDatabase_error,
          payment_action_other } from "../helpers/constants"
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
          newPaymentOperateEvent(user.email, payment_action_customer_create_error);
          return;
        }
      } 
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customer.id,
      }).catch((err) => {
        newPaymentOperateEvent(user.email, payment_action_payment_attach_error, 0, 0, paymentMethod.id, customer.id);
        
      });
    /*--------------- delete last payment -S-------------------------------------------------*/
      if(user.payment.customerID && user.payment.canceled !== true) {
        stripe.customers.del(user.payment.customerID)
        newPaymentOperateEvent(user.email, payment_action_delete_customer, 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscriptionID, user.payment.subscription)
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
          .catch((err) => {
            newPaymentOperateEvent(user.email, payment_action_subscription_create_error, 0, 0, paymentMethod.id, customer.id)
            return response.send(err)
          });
          
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
              ? new Date(moment().add(code.trailDays + 2, "days").format("YYYY/MM/DD"))
              : new Date(moment().add(32, "days").format("YYYY/MM/DD")),
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
      
      newPaymentOperateEvent(user.email, reactivate ? payment_action_new_subscription_reactivate : payment_action_new_subscription, 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscriptionID, user.payment.subscription)

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
        newPaymentOperateEvent(user.email, payment_action_payment_attach_error, 0, 0, newPaymentMethod.id, customerID)
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
      newPaymentOperateEvent(user.email, payment_action_update_paymentMethod, 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscriptionID, user.payment.subscription)
      response.send({success: true,data:res});

    });
  }
);

export const cancelSubscription = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
      const { id } = request.body;
      const connection = await connect();
      const repo = connection.getRepository(Users);

      let user = await repo.findOne({ id: id });
      try{
        const { subscriptionID } = user.payment;
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
        newPaymentOperateEvent(user.email, payment_action_cancel_subscription, 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscriptionID, user.payment.subscription)
        response.send({success: true,data:canceled});
      } catch(err) {
        newPaymentOperateEvent(user.email, payment_action_subscription_cancel_error, 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscriptionID, user.payment.subscription)
        response.send({success:false, message:err.raw.message})
      } 
    });
  }
);

export const reActiveSubscription = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
      const { id } = request.body;
      const connection = await connect();
      const repo = connection.getRepository(Users);

      let user = await repo.findOne({ id: id });
      try{
        
        const { subscriptionID } = user.payment;
        const updatedSubscription = await stripe.subscriptions.update(subscriptionID,{
          cancel_at_period_end: false
        })
        let currentPeriodEnd = new Date(updatedSubscription.current_period_end * 1000);
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 2);

        if(!updatedSubscription.cancel_at_period_end) {
          user.payment = {
                ...user.payment,
                canceled: false,
                subscription: currentPeriodEnd,
              };
          await repo.save(user);
        }
        response.send({success: true,data:updatedSubscription});
        newPaymentOperateEvent(user.email, payment_action_reactivate_canceled_subscription, 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscriptionID, user.payment.subscription)
      } catch(err) {
        newPaymentOperateEvent(user.email, payment_action_subscription_reactive_error, 0, 0, user.payment.paymentMethod.id, user.payment.customerID, user.payment.subscriptionID, user.payment.subscription)
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
      // let event = request.body;
      try {
        event = stripe.webhooks.constructEvent(
          request.rawBody,
          sig,
          endpointSecret
        );
      } catch (err) {
        response.send({ status: "error" });
        newPaymentOperateEvent('', payment_action_webhook_construct_error);
        return;
      }

      const intent: any = event.data.object;
      const connection = await connect();
      const repoUsers = connection.getRepository(Users);
      let subscription_id = '';
      let subscriptionFinishDate = new Date(0);

      switch (event.type) {
        case "payment_intent.succeeded":{

          let user = await repoUsers.findOne({
            email: intent.charges.data[0].billing_details.email,
          });
          if(!user) {
            newPaymentOperateEvent(user.email, payment_action_intent_userDeletedOnDatabase_error)
            response.send({ status: "error", message: "Current user was deleted on database" });
            return;
          }
          
          const payment = {
            ...user.payment,
            id: intent.id,
            created: intent.created,
            amount: intent.amount,
            subscription: new Date(
              moment().add(32, "days").format("YYYY/MM/DD")
            ),
          };

          subscriptionFinishDate = payment.subscription;

          user.payment = payment;
          subscription_id = user.payment.subscriptionID;

          await repoUsers.save(user);

          sendSubscriptionEmail(intent.charges.data[0].billing_details.email);

          break;
        }
        case "payment_intent.payment_failed":{
          const message =
          intent.last_payment_error && intent.last_payment_error.message;
          console.log("Failed:", intent.id, message);

          let user = await repoUsers.findOne({
            email: intent.charges.data[0].billing_details.email,
          });
          if(!user) {
            newPaymentOperateEvent(user.email, payment_action_intent_userDeletedOnDatabase_error)
            response.send({ status: "error", message: "Current user was deleted on database" });
            return;
          }
          
          subscriptionFinishDate = new Date();
          subscriptionFinishDate.setDate(subscriptionFinishDate.getDate() - 1)
          subscription_id = user.payment.subscriptionID;
          const payment = {
            ...user.payment,
            id: intent.id,
            created: intent.created,
            amount: intent.amount,
            subscription: subscriptionFinishDate
          };

          user.payment = payment;

          await repoUsers.save(user);
          break;
        }
          
      }
      const eventType = {
        "payment_intent.succeeded" : payment_action_intent_succeeded,
        "payment_intent.payment_failed" : payment_action_intent_failed
      }
      const email = intent.charges.data[0].billing_details.email;
      const type = eventType[event.type] !== undefined ? eventType[event.type] : payment_action_other;
      const amount = intent.amount;
      const amount_captured = intent.amount_captured;
      const payment_id = intent.charges.data[0].payment_method;
      const customer_id = intent.charges.data[0].customer;
      const err_msg = eventType[event.type] == payment_action_intent_failed && intent.last_payment_error && intent.last_payment_error.message ? intent.last_payment_error.message : '';
      if(subscription_id === ''){
        newPaymentOperateEvent(email, payment_action_intent_subscriptionDeletedOnDatabase_error);
      }
      else newPaymentOperateEvent(email, type, amount, amount_captured, payment_id, customer_id, subscription_id, subscriptionFinishDate, err_msg);
      response.send({ status: "success" });
    }, false);
  }
);
