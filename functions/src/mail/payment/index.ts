// @ts-ignore
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const gmailEmail = 'customerservice@learnwithsocrates.com';
const gmailPassword = '#[,.m/;<V?';

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

let htmlmail='<p>Take our assessment and discover your stats</p>'

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
    } catch(error) {
        console.error('There was an error while sending the email:', error);
    }
    return null;
};
