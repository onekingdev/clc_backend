// @ts-ignore
const functions = require('firebase-functions');
const fs=require('fs');
const nodemailer = require('nodemailer');

const gmailEmail = 'customerservice@learnwithsocrates.com';
const gmailPassword = 'itspphoogbcfzasb';

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

let htmlmail=fs.readFileSync("lib/mail/payment/paymentTemplate.html","utf-8").toString();

export const sendSubscriptionEmail = (email: string) => {
    const recipent_email = email;

    const mailOptions = {
        from: '"customerservice" <customerservice@learnwithsocrates.com>',
        to: recipent_email,
        subject: 'Chip Leader Coaching AI Subscription',
        html: htmlmail
    };

    try {
        mailTransport.sendMail(mailOptions);
        console.log('mail send');

    } catch(error) {
        console.error('There was an error while sending the email:', error);
    }
    return null;
};