// @ts-ignore
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const gmailEmail = 'customerservice@learnwithsocrates.com';
const gmailPassword = 'scgzwwviuqsvcgds';

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

let htmlmail='<p>This is report mail</p>'
const sendTime = "17-00";           //time to send mail : 17h 00m
export const sendReportEmail = functions.pubsub.schedule(`${sendTime.split("-")[1]} ${sendTime.split("-")[0]} * * *`).onRun((context) => {             //default timezone is America/Los_Angeles
    const recipent_email_list = ["armin@learnwithsocrates.com", "brian@learnwithsocrates.com", "candy@learnwithsocrates.com"];
    const recipent_email_string = recipent_email_list.toString();
    const mailOptions = {
        from: '"customerservice" <customerservice@learnwithsocrates.com>',
        to: recipent_email_string,
        subject: 'Chip Leader Coaching AI Report',
        html: htmlmail
    };
    try {
        mailTransport.sendMail(mailOptions);
        console.log('report mail send');

    } catch(error) {
        console.error('There was an error while sending the email:', error);
    }
    return null;
});

