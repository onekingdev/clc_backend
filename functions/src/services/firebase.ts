import * as firebase from 'firebase';
import 'firebase/auth';

/*---------------- prodction firebase -S------------------------*
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
/*---------------- prodction firebase -E------------------------*/

/*------------------ developement -S------------------*/
const app = firebase.default.initializeApp( {
    apiKey: "AIzaSyBRoGNgYCTGL7jZnQZ_wDq2OkibJP_L-gE",
    authDomain: "devenvclc.firebaseapp.com",
    projectId: "devenvclc",
    storageBucket: "devenvclc.appspot.com",
    messagingSenderId: "16835516799",
    appId: "1:16835516799:web:596ba8345ecee4353c624a",
    measurementId: "${config.measurementId}"
});
/*------------------ developement -E------------------*/

export {app};