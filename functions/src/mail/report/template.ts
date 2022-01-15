import moment = require("moment");
import { payment_action_intent_succeeded, 
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
         payment_action_customer_payUpdate_error,
         payment_action_subscription_cancel_error,
         payment_action_subscription_reactive_error,
         payment_action_webhook_construct_error,
         payment_action_intent_userDeletedOnDatabase_error,
         payment_action_intent_subscriptionDeletedOnDatabase_error
        } from "../../helpers/constants";

export const template = (createdUsersCount, loginedUsers, from, to, dailyPassword, paySuccCount, payFailCount, paymentHistory) => {
    const today = new Date();

    from = moment(from).format('YYYY-MM-DD  hh:mm:ss')
    to = moment(to).format('YYYY-MM-DD  hh:mm:ss')

    const title = `CLC(${process.env.GCLOUD_PROJECT}) Report on ${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    const date = `( ${from} ~ ${to} )`;
    const brief = `Today ${createdUsersCount} new users were registered and ${loginedUsers.length} users logined at the site.`
    const payHistoryBrief = `Today ${paySuccCount} payments were successful and ${payFailCount} payments were failed.`
    let userTableContent = '';
    for(let loginedUser of loginedUsers) {
        userTableContent += `
            <tr>
                <td>${loginedUser['users_email']}</td>
                <td>${moment(loginedUser['users_createdAt']).format('YYYY-MM-DD  hh:mm:ss')}</td>
                <td>${moment(loginedUser['users_lastLoginAt']).format('YYYY-MM-DD  hh:mm:ss')}</td>
                <td>${loginedUser['users_correctQuestions']}</td>
                <td>${loginedUser['users_wrongQuestions']}</td>
            </tr>
        `;
    }
    const userTable = `
    <table id="customers">
        <tr>
            <th>User Name</th>
            <th>Create Time</th>
            <th>Login Time</th>
            <th>Correct Answered Questions</th>
            <th>Wrong Answered Questions</th>
        </tr>
       ${userTableContent}
    </table>`;

    let payHistoryTableContent = '';
    for(let row of paymentHistory) {
        switch(row['paymentHistory_action']){
            case payment_action_intent_succeeded :
                row['paymentHistory_action'] = "Payment Intent Succeed"
                break;
            case payment_action_intent_failed :
                row['paymentHistory_action'] = "Payment Intent Fail"
                break;
            case payment_action_new_subscription :
                row['paymentHistory_action'] = "New Subscription"
                break;
            case payment_action_new_subscription_reactivate :
                row['paymentHistory_action'] = "Reactive Subscription(new)"
                break;
            case payment_action_cancel_subscription :
                row['paymentHistory_action'] = "Cancel Subscription"
                break;
            case payment_action_reactivate_canceled_subscription :
                row['paymentHistory_action'] = "Reactive Canceled Subscription"
                break;
            case payment_action_update_paymentMethod :
                row['paymentHistory_action'] = "Update Card"
                break;
            case payment_action_delete_customer :
                row['paymentHistory_action'] = "Delete Customer"
                break;
            case payment_action_delete_customer :
                row['payment_action_subscription_create_error'] = "Create Subscription Error"
                break;
            case payment_action_delete_customer :
                row['payment_action_customer_create_error'] = "Create Customer Error"
                break;
            case payment_action_delete_customer :
                row['payment_action_payment_attach_error'] = "Attach Payment Error"
                break;
            case payment_action_delete_customer :
                row['payment_action_customer_payUpdate_error'] = "Customer Payment Update Error"
                break;
            case payment_action_delete_customer :
                row['payment_action_subscription_cancel_error'] = "Cancel Subscription Error"
                break;
            case payment_action_delete_customer :
                row['payment_action_subscription_reactive_error'] = "Reactivate Subscription Error"
                break;
            case payment_action_delete_customer :
                row['payment_action_webhook_construct_error'] = "Webhook Construct Error"
                break;
            case payment_action_delete_customer :
                row['payment_action_intent_userDeletedOnDatabase_error'] = "User Not Exists on Database Error"
                break;
            case payment_action_delete_customer :
                row['payment_action_intent_subscriptionDeletedOnDatabase_error'] = "Subscription Not Exists on Database Error"
                break;
            // case payment_action_other :
            //     row['paymentHistory_action'] = "Other"
            //     break;
            default:
                row['paymentHistory_action'] = "Unknown"
                break;
                                                                                                                                
        }
        payHistoryTableContent += `
            <tr>
                <td>${row['paymentHistory_email']}</td>
                <td>${row['paymentHistory_action']}</td>
                <td>${moment(row['paymentHistory_createdAt']).format('YYYY-MM-DD  hh:mm:ss')}</td>
                <td>${row['paymentHistory_amount']}</td>
                <td>${moment(row['paymentHistory_subscription_id']).format('YYYY-MM-DD  hh:mm:ss')}</td>
                <td>${moment(row['paymentHistory_subscriptionFinishAt']).format('YYYY-MM-DD  hh:mm:ss')}</td>
                <td>${row['coupon_code']}</td>
                <td>${row['paymentHistory_error_message']}</td>
            </tr>
        `;
    }

    const payHistoryTable = `
    <table id="customers">
        <tr>
            <th>User Email</th>
            <th>Action</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Subscription ID</th>
            <th>Subscription Finish Date</th>
            <th>Coupon Code</th>
            <th>Error Message</th>
        </tr>
       ${payHistoryTableContent}
    </table>`;

    return `
    <html>
        <head>
        <style>
        #customers {
            font-family: Arial, Helvetica, sans-serif;
            border-collapse: collapse;
            width: 100%;
        }
        
        #customers td, #customers th {
            border: 1px solid #ddd;
            padding: 8px;
        }
        
        #customers tr:nth-child(even){background-color: #f2f2f2;}
        
        #customers tr:hover {background-color: #ddd;}
        
        #customers th {
            padding-top: 12px;
            padding-bottom: 12px;
            text-align: left;
            background-color: #0e0f0f;
            color: white;
        }
        </style>
        </head>
        <body>
        
        <h2><center>${title}<center></h2>
        <p><center>${date}<center></p>
        <p><center>${brief}<center></p>
        ${userTable}
        <p><center>${payHistoryBrief}<center></p>
        ${payHistoryTable}
        <p><center>Password : ${dailyPassword}<center></p>

        </body>
        </html>
    `    
}