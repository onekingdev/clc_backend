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
export const sendReportEmail = functions.pubsub.schedule('5 14 * * *').onRun((context) => {             //default timezone is America/Los_Angeles
    const recipent_email = "mooncode610@gmail.com";

    const mailOptions = {
        from: '"customerservice" <customerservice@learnwithsocrates.com>',
        to: recipent_email,
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

