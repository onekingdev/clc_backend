// @ts-ignore
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const gmailEmail = 'customerservice@learnwithsocrates.com';
const gmailPassword = '#[,.m/;<V?';

const mailTransport = process.env.NODE_ENV !== 'local' && nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

let htmlmail="<p>Take our assessment and discover your stats</p>";

exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
    const recipent_email = user.email;
    const username = user.displayName;
    const mailOptions = {
        from: '"customerservice" <customerservice@learnwithsocrates.com>',
        to: `${username}, <${recipent_email}>`,
        subject: 'Welcome to Chip Leader Coaching AI',
        html: htmlmail
    };

    try {
        mailTransport.sendMail(mailOptions);
    } catch(error) {
        console.error('There was an error while sending the email:', error);
    }
    return null;
});
