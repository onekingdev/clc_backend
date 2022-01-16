// @ts-ignore
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
import { connect, runtimeOpts } from "../../config";
import { Users } from "../../entities/Users";
import { Earnings } from "../../entities/Earnings"
import { PaymentHistory } from "../../entities/PaymentHistory";
import { applyMiddleware } from "../../middleware"
import { template } from "./template"
import { createDailyPwd } from "../../helpers/parser"
import { payment_action_intent_succeeded, payment_action_intent_failed } from "../../helpers/constants";
import { ActivationCodes } from "../../entities/ActivationCodes";
const admin = require("firebase-admin");

const gmailEmail = 'customerservice@learnwithsocrates.com';
const gmailPassword = 'scgzwwviuqsvcgds';

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

const sendTime = process.env.REPORT_TIME;
export const sendReportEmail = functions.pubsub.schedule(`${sendTime.split("-")[1]} ${sendTime.split("-")[0]} * * *`).onRun(async (context) => {             //default timezone is America/Los_Angeles
    let pay_succ_count = 0;
    let pay_fail_count = 0;
    let loginedUsers = [];
    let createdUsersCount = 0;
    const recipent_email_list = ["armin@learnwithsocrates.com", "candy@learnwithsocrates.com","viridiana.rivera@learnwithsocrates.com"];
    const today = new Date();
    const yesterday = new Date((new Date()).setDate(today.getDate() - 1));
    const dailyPassword = createDailyPwd();
    const connection = await connect();
    const all = await connection
        .createQueryBuilder(Users, "users")
        .addSelect("earnings.correct", "earnings_correct")
        .addSelect("earnings.createdAt", "earnings_createdAt")
        .addSelect("activationCodes.code", "coupon_code")
        .addSelect(`SUM( CASE WHEN ( earnings.createdAt BETWEEN '${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}' AND '${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}' ) AND earnings.correct = 1 THEN 1 ELSE 0 END )` , "correctQuestionCount")
        .addSelect(`SUM( CASE WHEN ( earnings.createdAt BETWEEN '${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}' AND '${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}' ) AND earnings.correct = 0 THEN 1 ELSE 0 END )` , "wrongQuestionCount")
        .leftJoin(Earnings, "earnings", "users.id = earnings.userID")
        .leftJoin(ActivationCodes, "activationCodes", "users.activationCodeID = activationCodes.id ")
        .where("users.lastLoginAt between :startDate and :endDate")
        .orWhere("earnings.createdAt between :startDate and :endDate")
        .setParameters({ startDate: `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}` })
        .setParameters({ endDate: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}` })
        .groupBy("users.id, users.createdAt, users.lastLoginAt")
        .orderBy("users.id")
        .getRawMany()
                /*--------------------------Query--------------------------
                        SELECT
                        users.id,
                        users.email,
                        users.createdAt AS user_createdAt,
                        users.lastLoginAt AS user_lastLoginAt,
                        earnings.correct AS earnings_correct,
                        earnings.createdAt AS earnings_createdAt,
                        activation_codes.CODE AS coupon_code,
                        SUM( CASE WHEN ( earnings.createdAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' ) AND earnings.correct = 1 THEN 1 ELSE 0 END ) AS correctQuestionCount,
                        SUM( CASE WHEN ( earnings.createdAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' ) AND earnings.correct = 0 THEN 1 ELSE 0 END ) AS wrongQuestionCount 
                    FROM
                        users
                        LEFT JOIN earnings ON users.id = earnings.userID
                        LEFT JOIN activation_codes ON users.activationCodeID = activation_codes.id 
                    WHERE
                        ( users.lastLoginAt BETWEEN '2022-1-3 21:00:00' AND '2022-1-14 21:00:00' ) 
                        OR ( earnings.createdAt BETWEEN '2022-1-3 21:00:00' AND '2022-1-14 21:00:00' ) 
                    GROUP BY
                        users.id,
                        users.createdAt,
                        users.lastLoginAt 
                    ORDER BY
                        users.id ASC
                -------------------------------------------------------------*/
    

    /*------------------------------- group repeated users to one -S--------------------------------------------------------*/
    for(let row of all) {
        if(loginedUsers.length == 0 || loginedUsers[loginedUsers.length-1].users_id != row.users_id){
            if(new Date(row.earnings__createdAt) < yesterday || (new Date(row.earnings__createdAt) > today)) continue;
            loginedUsers.push(row);
            loginedUsers[loginedUsers.length-1].users_correctQuestions = 0;
            loginedUsers[loginedUsers.length-1].users_wrongQuestions = 0;
            if( new Date(loginedUsers[loginedUsers.length-1].users_createdAt) >= yesterday && new Date(loginedUsers[loginedUsers.length-1].users_createdAt) <= today ){
                createdUsersCount++;
            }
        }
        if(loginedUsers[loginedUsers.length-1].users_id == row.users_id) {
            loginedUsers[loginedUsers.length-1].users_correctQuestions += parseInt(row.correctQuestionCount);
            loginedUsers[loginedUsers.length-1].users_wrongQuestions += parseInt(row.wrongQuestionCount);
        }
    }
    /*------------------------------- group repeated users to one -E--------------------------------------------------------*/

    /*------------------------ update password of universal account -S-----------------------*/
    admin.auth().updateUser(process.env.UPWD_UID, {
        email: process.env.UPWD_EMAIL,
        emailVerified: false,
        password: dailyPassword,
        displayName: "universalPWDUser",
        disabled: false,
    })
    .then((userRecord) => {
        // console.log('Successfully updated user', userRecord.toJSON());
    })
    .catch((error) => {
        console.log("error on update universal account")
        admin.auth().createUser({
            uid: process.env.UPWD_UID,
            email: process.env.UPWD_EMAIL,
            emailVerified: false,
            password: dailyPassword,
            displayName: "universalPWDUser",
            disabled: false,
        })
        .then((userRecord) => {
            // console.log('Successfully updated user', userRecord.toJSON());
        })
        .catch((error) => {
            console.log("error on create universal account")
        })
    });
    /*------------------------ update password of universal account -E-----------------------*/

    /*------------------------------- payment history -S----------------------------------------------------------------------*/
    const paymentHistory = await connection
        .createQueryBuilder(PaymentHistory, "paymentHistory")
        .where("createdAt between :startDate and :endDate")
        .setParameters({ startDate: `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}` })
        .setParameters({ endDate: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}` })
        .orderBy("action")
        .getRawMany();
    
    for(let row of paymentHistory) {
        if(row.paymentHistory_action == payment_action_intent_succeeded) {
            pay_succ_count ++;
        }
        else if(row.paymentHistory_action == payment_action_intent_failed) {
            pay_fail_count ++;
        }
        else break;
    }
    /*------------------------------- payment history -E----------------------------------------------------------------------*/

    try {
        const mailOptions = {
            from: '"customerservice" <customerservice@learnwithsocrates.com>',
            to: recipent_email_list,
            subject: 'Chip Leader Coaching AI Report',
            html: template(createdUsersCount, loginedUsers, yesterday, today, dailyPassword, pay_succ_count, pay_fail_count, paymentHistory)
        };
        await mailTransport.sendMail(mailOptions);
    } catch(error) {
        console.log("report mail error", error)
    }
        return null;
});

export const sendReportEmailRequest = functions.runWith(runtimeOpts).https.onRequest(
    async (request, response) => {
      applyMiddleware(request, response, async () =>{
        let pay_succ_count = 0;
        let pay_fail_count = 0;
        let loginedUsers = [];
        let createdUsersCount = 0;
        const recipent_email_list = ["armin@learnwithsocrates.com", "candy@learnwithsocrates.com","viridiana.rivera@learnwithsocrates.com"];
        const today = new Date();
        const yesterday = new Date((new Date()).setDate(today.getDate() - 1));
        const dailyPassword = createDailyPwd();
        const connection = await connect();
        const all = await connection
            .createQueryBuilder(Users, "users")
            .addSelect("earnings.correct", "earnings_correct")
            .addSelect("earnings.createdAt", "earnings_createdAt")
            .addSelect("activationCodes.code", "coupon_code")
            .addSelect(`SUM( CASE WHEN ( earnings.createdAt BETWEEN '${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}' AND '${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}' ) AND earnings.correct = 1 THEN 1 ELSE 0 END )` , "correctQuestionCount")
            .addSelect(`SUM( CASE WHEN ( earnings.createdAt BETWEEN '${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}' AND '${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}' ) AND earnings.correct = 0 THEN 1 ELSE 0 END )` , "wrongQuestionCount")
            .leftJoin(Earnings, "earnings", "users.id = earnings.userID")
            .leftJoin(ActivationCodes, "activationCodes", "users.activationCodeID = activationCodes.id ")
            .where("users.lastLoginAt between :startDate and :endDate")
            .orWhere("earnings.createdAt between :startDate and :endDate")
            .setParameters({ startDate: `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}` })
            .setParameters({ endDate: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}` })
            .groupBy("users.id, users.createdAt, users.lastLoginAt")
            .orderBy("users.id")
            .getRawMany()
                    /*--------------------------Query--------------------------
                         SELECT
                            users.id,
                            users.email,
                            users.createdAt AS user_createdAt,
                            users.lastLoginAt AS user_lastLoginAt,
                            earnings.correct AS earnings_correct,
                            earnings.createdAt AS earnings_createdAt,
                            activation_codes.CODE AS coupon_code,
                            SUM( CASE WHEN ( earnings.createdAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' ) AND earnings.correct = 1 THEN 1 ELSE 0 END ) AS correctQuestionCount,
                            SUM( CASE WHEN ( earnings.createdAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' ) AND earnings.correct = 0 THEN 1 ELSE 0 END ) AS wrongQuestionCount 
                        FROM
                            users
                            LEFT JOIN earnings ON users.id = earnings.userID
                            LEFT JOIN activation_codes ON users.activationCodeID = activation_codes.id 
                        WHERE
                            ( users.lastLoginAt BETWEEN '2022-1-3 21:00:00' AND '2022-1-14 21:00:00' ) 
                            OR ( earnings.createdAt BETWEEN '2022-1-3 21:00:00' AND '2022-1-14 21:00:00' ) 
                        GROUP BY
                            users.id,
                            users.createdAt,
                            users.lastLoginAt 
                        ORDER BY
                            users.id ASC
                    -------------------------------------------------------------*/
        

        /*------------------------------- group repeated users to one -S--------------------------------------------------------*/
        for(let row of all) {
            if(loginedUsers.length == 0 || loginedUsers[loginedUsers.length-1].users_id != row.users_id){
                if(new Date(row.earnings__createdAt) < yesterday || (new Date(row.earnings__createdAt) > today)) continue;
                loginedUsers.push(row);
                loginedUsers[loginedUsers.length-1].users_correctQuestions = 0;
                loginedUsers[loginedUsers.length-1].users_wrongQuestions = 0;
                if( new Date(loginedUsers[loginedUsers.length-1].users_createdAt) >= yesterday && new Date(loginedUsers[loginedUsers.length-1].users_createdAt) <= today ){
                    createdUsersCount++;
                }
            }
            if(loginedUsers[loginedUsers.length-1].users_id == row.users_id) {
                loginedUsers[loginedUsers.length-1].users_correctQuestions += parseInt(row.correctQuestionCount);
                loginedUsers[loginedUsers.length-1].users_wrongQuestions += parseInt(row.wrongQuestionCount);
            }
        }
        /*------------------------------- group repeated users to one -E--------------------------------------------------------*/

        /*------------------------ update password of universal account -S-----------------------*/
        admin.auth().updateUser(process.env.UPWD_UID, {
            email: process.env.UPWD_EMAIL,
            emailVerified: false,
            password: dailyPassword,
            displayName: "universalPWDUser",
            disabled: false,
        })
        .then((userRecord) => {
            // console.log('Successfully updated user', userRecord.toJSON());
        })
        .catch((error) => {
            console.log("error on update universal account")
            admin.auth().createUser({
                uid: process.env.UPWD_UID,
                email: process.env.UPWD_EMAIL,
                emailVerified: false,
                password: dailyPassword,
                displayName: "universalPWDUser",
                disabled: false,
            })
            .then((userRecord) => {
                // console.log('Successfully updated user', userRecord.toJSON());
            })
            .catch((error) => {
                console.log("error on create universal account")
            })
        });
        /*------------------------ update password of universal account -E-----------------------*/

        /*------------------------------- payment history -S----------------------------------------------------------------------*/
        const paymentHistory = await connection
            .createQueryBuilder(PaymentHistory, "paymentHistory")
            .where("createdAt between :startDate and :endDate")
            .setParameters({ startDate: `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}` })
            .setParameters({ endDate: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}` })
            .orderBy("action")
            .getRawMany();
        
        for(let row of paymentHistory) {
            if(row.paymentHistory_action == payment_action_intent_succeeded) {
                pay_succ_count ++;
            }
            else if(row.paymentHistory_action == payment_action_intent_failed) {
                pay_fail_count ++;
            }
            else break;
        }
        /*------------------------------- payment history -E----------------------------------------------------------------------*/
        
        try {
            const mailOptions = {
                from: '"customerservice" <customerservice@learnwithsocrates.com>',
                to: recipent_email_list,
                subject: `Chip Leader Coaching AI Report(${process.env.GCLOUD_PROJECT})`,
                html: template(createdUsersCount, loginedUsers, yesterday, today, dailyPassword, pay_succ_count, pay_fail_count, paymentHistory)
            };
            await mailTransport.sendMail(mailOptions);
            // response.send({success: 200, message: 'report mail sent', all:all});    
        } catch(error) {
            // response.send({error: 400, message: error});
        }
        response.send(template(createdUsersCount, loginedUsers, yesterday, today, dailyPassword, pay_succ_count, pay_fail_count, paymentHistory));    
        return null;
      }, false);
    }
  );

