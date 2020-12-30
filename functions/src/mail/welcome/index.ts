const functions = require('firebase-functions');
const admin = require("firebase-admin");
const fs=require('fs');
const nodemailer = require('nodemailer');

admin.initializeApp();

const gmailEmail = "armando.gutierrez@learnwithsocrates.com";
const gmailPassword = "Bl0ck0101";
const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

let htmlmail=fs.readFileSync("lib/mail/welcome/welcome.html","utf-8").toString();

exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
    const recipent_email = user.email;

    const mailOptions = {
        from: '"sender name" <sendermail@gmail.com>',
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