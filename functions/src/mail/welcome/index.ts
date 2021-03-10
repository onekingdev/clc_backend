// @ts-ignore
const functions = require('firebase-functions');
const admin = require("firebase-admin");
const fs=require('fs');
const nodemailer = require('nodemailer');

admin.initializeApp();

const gmailEmail = 'customerservice@learnwithsocrates.com';
const gmailPassword = 'itspphoogbcfzasb';

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

let htmlmail=fs.readFileSync("lib/mail/welcome/welcomeTemplate.html","utf-8").toString();

exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
    const recipent_email = user.email;

    const mailOptions = {
        from: '"customerservice" <customerservice@learnwithsocrates.com>',
        to: recipent_email,
        subject: 'Welcome to Chip Leader Coaching AI',
        html: htmlmail
    };

    try {
        mailTransport.sendMail(mailOptions);
        console.log('mail send');

    } catch(error) {
        console.error('There was an error while sending the email:', error);
    }
    return null;
});