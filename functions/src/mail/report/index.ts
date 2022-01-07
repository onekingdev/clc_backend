// @ts-ignore
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
import { connect, runtimeOpts } from "../../config";
import { Users } from "../../entities/Users";
import { Earnings } from "../../entities/Earnings"
import {applyMiddleware} from "../../middleware"


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
        .addSelect("COUNT(earnings.id)", "questions")
        .leftJoin(Earnings, "earnings", "users.id = earnings.userID")
        .where("users.lastLoginAt between :startDate and :endDate")
        .orWhere("earnings.createdAt between :startDate and :endDate")
        .setParameters({ startDate: `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}` })
        .setParameters({ endDate: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}` })
        .groupBy("users.id, users.createdAt, users.lastLoginAt, earnings.correct")
        .orderBy("users.id")
        .getRawMany();
                /*--------------------------Query--------------------------
                SELECT
                    users.id,
                    users.email,
                    users.createdAt AS user_createdAt,
                    users.lastLoginAt AS user_lastLoginAt,
                    earnings.correct AS earnings_correct,
                    earnings.createdAt AS earnings_createdAt,
                    COUNT( earnings.id ) AS questions 
                FROM
                    users
                    LEFT JOIN earnings ON users.id = earnings.userID 
                WHERE
                    (users.lastLoginAt between '2022-1-6 02:00:00' and '2022-1-7 02:00:00' )
                    OR (earnings.createdAt between '2022-1-6 02:00:00' and '2022-1-7 02:00:00' )
                GROUP BY
                    users.id,
                    users.createdAt,
                    users.lastLoginAt,
                    earnings.correct 
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
            if(row.earnings_correct) loginedUsers[loginedUsers.length-1].users_correctQuestions += parseInt(row.questions);
            else loginedUsers[loginedUsers.length-1].users_wrongQuestions += parseInt(row.questions);
        }
    }
    /*------------------------------- group repeated users to one -E--------------------------------------------------------*/
    
    try {
        recipent_email_list.forEach(async function(value, index){
            const mailOptions = {
                from: '"customerservice" <customerservice@learnwithsocrates.com>',
                to: value,
                subject: 'Chip Leader Coaching AI Report',
                html: mailTemplate(createdUsersCount, loginedUsers, yesterday, today)
            };
            await mailTransport.sendMail(mailOptions);
        })
        console.log("report mail sent")
        console.log("today is ", today, " ", "yesterday is ", yesterday);        
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
            .addSelect("COUNT(earnings.id)", "questions")
            .leftJoin(Earnings, "earnings", "users.id = earnings.userID")
            .where("users.lastLoginAt between :startDate and :endDate")
            .orWhere("earnings.createdAt between :startDate and :endDate")
            .setParameters({ startDate: `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()} ${yesterday.getHours()}:${yesterday.getMinutes()}:${yesterday.getSeconds()}` })
            .setParameters({ endDate: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}` })
            .groupBy("users.id, users.createdAt, users.lastLoginAt, earnings.correct")
            .orderBy("users.id")
            .getRawMany();
                    /*--------------------------Query--------------------------
                    SELECT
                        users.id,
                        users.email,
                        users.createdAt AS user_createdAt,
                        users.lastLoginAt AS user_lastLoginAt,
                        earnings.correct AS earnings_correct,
                        earnings.createdAt AS earnings_createdAt,
                        COUNT( earnings.id ) AS questions 
                    FROM
                        users
                        LEFT JOIN earnings ON users.id = earnings.userID 
                    WHERE
                        (users.lastLoginAt between '2022-1-6 02:00:00' and '2022-1-7 02:00:00' )
                        OR (earnings.createdAt between '2022-1-6 02:00:00' and '2022-1-7 02:00:00' )
                    GROUP BY
                        users.id,
                        users.createdAt,
                        users.lastLoginAt,
                        earnings.correct 
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
                if(row.earnings_correct) loginedUsers[loginedUsers.length-1].users_correctQuestions += parseInt(row.questions);
                else loginedUsers[loginedUsers.length-1].users_wrongQuestions += parseInt(row.questions);
            }
        }
        /*------------------------------- group repeated users to one -E--------------------------------------------------------*/
        
        try {
            recipent_email_list.forEach(async function(value, index){
                const mailOptions = {
                    from: '"customerservice" <customerservice@learnwithsocrates.com>',
                    to: value,
                    subject: 'Chip Leader Coaching AI Report',
                    html: mailTemplate(createdUsersCount, loginedUsers, yesterday, today)
                };
                await mailTransport.sendMail(mailOptions);
            })
            response.send({success: 200, message: 'report mail sent', all:all});    
            console.log("today is ", today, " ", "yesterday is ", yesterday);        
        } catch(error) {
            response.send({error: 400, message: error});
        }
        return null;
      }, false);
    }
  );

const mailTemplate = (createdUsersCount, loginedUsers, from, to) => {
    const today = new Date();
    const title = `This is the CLC(${process.env.GCLOUD_PROJECT}) Report on ${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    const date = `( ${from} ~ ${to} )`;
    const brief = `Today ${createdUsersCount} new users were registered and ${loginedUsers.length} users logined at the site.`
    
    let tableContent = '';
    for(let loginedUser of loginedUsers) {
        tableContent += `
            <tr>
                <td>${loginedUser['users_email']}</td>
                <td>${loginedUser['users_lastLoginAt']}</td>
                <td>${loginedUser['users_correctQuestions']}</td>
                <td>${loginedUser['users_wrongQuestions']}</td>
            </tr>
        `;
    }
    const table = `
    <table id="customers">
        <tr>
            <th>User Name</th>
            <th>Login Time</th>
            <th>Correct Answered Questions</th>
            <th>Wrong Answered Questions</th>
        </tr>
       ${tableContent}
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
        
        <p><center>${title}<center></p>
        <p><center>${date}<center></p>
        <p><center>${brief}<center></p>
        ${table}
        </body>
        </html>
    `    
}