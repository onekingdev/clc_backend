// @ts-ignore
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
import { connect, runtimeOpts } from "../../config";
import { Users } from "../../entities/Users";
import { Earnings } from "../../entities/Earnings"
import {applyMiddleware} from "../../middleware"
import { template } from "./template"

const gmailEmail = 'customerservice@learnwithsocrates.com';
const gmailPassword = 'scgzwwviuqsvcgds';

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

const sendTime = "17-00";           //time to send mail : 17h 00m
export const sendReportEmail = functions.pubsub.schedule(`${sendTime.split("-")[1]} ${sendTime.split("-")[0]} * * *`).onRun(async (context) => {             //default timezone is America/Los_Angeles
    const recipent_email_list = ["armin@learnwithsocrates.com", "brian@learnwithsocrates.com", "candy@learnwithsocrates.com"];
    let today = new Date();
    let yesterday = new Date((new Date()).setDate(today.getDate() - 1));
    const connection = await connect();
    const all = await connection
            .createQueryBuilder(Users, "users")
            .addSelect("earnings.correct", "earnings_correct")
            .addSelect("earnings.createdAt", "earnings_createdAt")
            .addSelect(`SUM( CASE WHEN ( earnings.createdAt BETWEEN '${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}' AND '${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}' ) AND earnings.correct = 1 THEN 1 ELSE 0 END )` , "correctQuestionCount")
            .addSelect(`SUM( CASE WHEN ( earnings.createdAt BETWEEN '${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}' AND '${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}' ) AND earnings.correct = 0 THEN 1 ELSE 0 END )` , "wrongQuestionCount")
            .leftJoin(Earnings, "earnings", "users.id = earnings.userID")
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
                    SUM( CASE WHEN ( earnings.createdAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' ) AND earnings.correct = 1 THEN 1 ELSE 0 END ) AS correctQuestionCount,
                    SUM( CASE WHEN ( earnings.createdAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' ) AND earnings.correct = 0 THEN 1 ELSE 0 END ) AS wrongQuestionCount	
                FROM
                    users
                    LEFT JOIN earnings ON users.id = earnings.userID 
                WHERE
                    ( users.lastLoginAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' ) 
                    OR ( earnings.createdAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' )
                    GROUP BY
                        users.id,
                        users.createdAt,
                        users.lastLoginAt
                    
                ORDER BY
                    users.id ASC
                -------------------------------------------------------------*/
    let loginedUsers = [];
    let createdUsersCount = 0;
    
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
            if(row.earnings_correct) loginedUsers[loginedUsers.length-1].users_correctQuestions += parseInt(row.correctQuestionCount);
            else loginedUsers[loginedUsers.length-1].users_wrongQuestions += parseInt(row.wrongQuestionCount);
        }
    }
    /*------------------------------- group repeated users to one -E--------------------------------------------------------*/
    
    try {
        recipent_email_list.forEach(async function(value, index){
            const mailOptions = {
                from: '"customerservice" <customerservice@learnwithsocrates.com>',
                to: value,
                subject: 'Chip Leader Coaching AI Report',
                html: template(createdUsersCount, loginedUsers, yesterday, today)
            };
            await mailTransport.sendMail(mailOptions);
        })
        console.log("report mail sent")
    } catch(error) {
        console.log("report mail error", error)
    }
        return null;
});


export const sendReportEmailRequest = functions.runWith(runtimeOpts).https.onRequest(
    async (request, response) => {
      applyMiddleware(request, response, async () =>{
        const recipent_email_list = ["armin@learnwithsocrates.com", "candy@learnwithsocrates.com","viridiana.rivera@learnwithsocrates.com"];
        let today = new Date();
        let yesterday = new Date((new Date()).setDate(today.getDate() - 1));
        const connection = await connect();
        const all = await connection
            .createQueryBuilder(Users, "users")
            .addSelect("earnings.correct", "earnings_correct")
            .addSelect("earnings.createdAt", "earnings_createdAt")
            .addSelect(`SUM( CASE WHEN ( earnings.createdAt BETWEEN '${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}' AND '${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}' ) AND earnings.correct = 1 THEN 1 ELSE 0 END )` , "correctQuestionCount")
            .addSelect(`SUM( CASE WHEN ( earnings.createdAt BETWEEN '${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}' AND '${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}' ) AND earnings.correct = 0 THEN 1 ELSE 0 END )` , "wrongQuestionCount")
            .leftJoin(Earnings, "earnings", "users.id = earnings.userID")
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
                        SUM( CASE WHEN ( earnings.createdAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' ) AND earnings.correct = 1 THEN 1 ELSE 0 END ) AS correctQuestionCount,
                        SUM( CASE WHEN ( earnings.createdAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' ) AND earnings.correct = 0 THEN 1 ELSE 0 END ) AS wrongQuestionCount	
                    FROM
                        users
                        LEFT JOIN earnings ON users.id = earnings.userID 
                    WHERE
                        ( users.lastLoginAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' ) 
                        OR ( earnings.createdAt BETWEEN '2022-1-7 21:00:00' AND '2022-1-10 21:00:00' )
                        GROUP BY
                            users.id,
                            users.createdAt,
                            users.lastLoginAt
                        
                    ORDER BY
                        users.id ASC
                    -------------------------------------------------------------*/
        let loginedUsers = [];
        let createdUsersCount = 0;

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
                if(row.earnings_correct) loginedUsers[loginedUsers.length-1].users_correctQuestions += parseInt(row.correctQuestionCount);
                else loginedUsers[loginedUsers.length-1].users_wrongQuestions += parseInt(row.wrongQuestionCount);
            }
        }
        /*------------------------------- group repeated users to one -E--------------------------------------------------------*/
        try {
            recipent_email_list.forEach(async function(value, index){
                const mailOptions = {
                    from: '"customerservice" <customerservice@learnwithsocrates.com>',
                    to: value,
                    subject: 'Chip Leader Coaching AI Report',
                    html: template(createdUsersCount, loginedUsers, yesterday, today)
                };
                await mailTransport.sendMail(mailOptions);
            })
            response.send({success: 200, message: 'report mail sent', all:all});    
        } catch(error) {
            response.send({error: 400, message: error});
        }
        return null;
      }, false);
    }
  );

