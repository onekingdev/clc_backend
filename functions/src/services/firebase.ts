import * as firebase from 'firebase';
import 'firebase/auth';

const app = firebase.default.initializeApp( {
    apiKey: "AIzaSyDjDLYRdraVPdvJDV6GjpWfaiRM0XJHrys",
    authDomain: "chipleadercoaching-webapp.firebaseapp.com",
    databaseURL: "https://chipleadercoaching-webapp.firebaseio.com",
    projectId: "chipleadercoaching-webapp",
    storageBucket: "chipleadercoaching-webapp.appspot.com",
    messagingSenderId: "446390346165",
    appId: "1:446390346165:web:30ad9553d10dbb757ff9fc",
    measurementId: "G-MJW9SW2Z64"
});

export {app};