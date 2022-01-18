import * as firebase from 'firebase';
import 'firebase/auth';

const admin = require("firebase-admin");
require("dotenv").config();

let app;
/*------------------ developement -S------------------*/
if(process.env.GCLOUD_PROJECT == "devenvclc") {
    app = firebase.default.initializeApp( {
        apiKey: "AIzaSyBRoGNgYCTGL7jZnQZ_wDq2OkibJP_L-gE",
        authDomain: "devenvclc.firebaseapp.com",
        projectId: "devenvclc",
        storageBucket: "devenvclc.appspot.com",
        messagingSenderId: "16835516799",
        appId: "1:16835516799:web:596ba8345ecee4353c624a",
        measurementId: "${config.measurementId}"
    });
}
/*------------------ developement -E------------------*/

/*---------------- prodction firebase -S------------------------*/
else {
    app = firebase.default.initializeApp( {
        apiKey: "AIzaSyDjDLYRdraVPdvJDV6GjpWfaiRM0XJHrys",
        authDomain: "chipleadercoaching-webapp.firebaseapp.com",
        databaseURL: "https://chipleadercoaching-webapp.firebaseio.com",
        projectId: "chipleadercoaching-webapp",
        storageBucket: "chipleadercoaching-webapp.appspot.com",
        messagingSenderId: "446390346165",
        appId: "1:446390346165:web:30ad9553d10dbb757ff9fc",
        measurementId: "G-MJW9SW2Z64"
    });
}
/*---------------- prodction firebase -E------------------------*/

const initFirebaseAdmin = () => {
    // var serviceAccount = {
    //     "type": "service_account",
    //     "project_id": "devenvclc",
    //     "private_key_id": "e86ca7e2a62a3920ca18dca0572b2f23017b420e",
    //     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCVzy/TqO6YFF0U\nP2Nn8cWt1LsKDqyqSmNEF3soL8/Wy4LTBHyWKSQ+UBC3BMurUJSo0mFu2BKdYxdf\nODXiOMxiR9NDA6Tgp6I1zdLopm2Vb2sitiLbqdQjIP7+jIoePz6o9HyCMOL54XSR\nR454UKwMkbEljrGwfNY3b5ujfocfOf5ccfFk3jnVrHJ7KNjWXjxVQtvjzd5P2/r/\nkgIxP3d3DPkk0TJ6iJoMJ8Z+fI52XC2VpnEX6Hy4+tyRtIvvh/kVkkHiG8bvKZiq\nnklD4HcbW+SeFgYmNcEX+fi/hraaWExOmLwaDdPzoi+sLPTztZIRtYHKUF6xaDSR\nDYAARDd3AgMBAAECggEALpbsI1G2vgIbPmhGRHXKyfhOIN8WcLFItMzupr1T0FOj\nQHf1PQfXdy+UOy7ZHlKloOkolv3IsDy4cIr9KvkKCwiWWZGBDcLkbgIwNN1JWD95\n3KYzKghjandhBg30CFsX5BiAvkZw2FB23ZWY568DCremlW0OsrnoLv5dM1fustVu\nssO8ECnenrApY8M9S97JpgXTlppTku4LWeEQMjCqPWcHcTivxxiWgE8pPFhvT220\nw1qPNBkByWxhJScbVMlRPk6zwKrf0XbGfWR8B03fZpvsaQkU3qg/c1QQj87okx63\ngmkgIoACyGygdPqUiNc/oQAm/p0zWgAMlSpDL3g7BQKBgQDS4e5laH/qJXHpV2Z3\ngBrcahJaSCLjcNkod94x+JDW92MZijXSuXurwzy02KOyw69LYJxSc86eZLM7FPGe\nNfNfj3FjraAGG7JwXd8T+eXk8dJKYs+WW/fUDuX6ZyY3P8ckbdTOPmyxw4cyq9Ca\nxoONc/j459XSOvigYVWk8in3MwKBgQC13EQecQSNEGmpUGqNAhUO1MHEGpEY1klN\nNWUlhbKyiNq6p4LZj7ifxWCXAGsHK9bQa7+l9wQVegC+ylZwMpEWtKi7smmY6thx\n1SWiDV6piy8xQIz1UrDAeFz28UTXRrr/yJdVNBJcsfMl7Z0mt7BuwtSBnXnDm0oS\nipt1Xo8urQKBgCDisraFsUzmQflNc+E2zPmKYQpLLYWiV3sEFlZcmNmtAns9Hl+a\nJTsH2zOohP6fnXp3umjxPktdEMYp4fP2HdnNGLWeodHSB+WV/e+zjLJDM7P97LlZ\n5i/fkuWVqFP9UiTQK9ttyK1//Fleic1ZH7KzXyQRozqBj7wS8bQjP4AZAoGAeBlO\nowvgBYihPr9snlKRtYmrrOYejFh3cBWjBnSU3nKigEG/mA3hzyF5+D6+b63z3xBJ\nMEFA4S4A7/6PtuiuCGCmTc41DleJOSOaBrrtmOnh8JTAggJp17GlMy+CVujO9bxy\ntEH/HlgmSxXwgnEsgvkHfdGRaCxVbok6wPgBdsECgYA52AyAmWl/321/keclf+Kk\n47gA6HGGmhueFjg+NEhbzpKsCapacthvH1VTWCxeV8GB2wSv6fVrPrLlw9NDivqI\n4PFdlm7rpdGuLHieP2/OS5LxLfHD8TiN79DUKbbm+JGBnb47GwgPXYuHjR9u975l\ndk2mFa4Y6lV50EaFxK8fbw==\n-----END PRIVATE KEY-----\n",
    //     "client_email": "firebase-adminsdk-kn8xj@devenvclc.iam.gserviceaccount.com",
    //     "client_id": "117075165974411274937",
    //     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    //     "token_uri": "https://oauth2.googleapis.com/token",
    //     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    //     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-kn8xj%40devenvclc.iam.gserviceaccount.com"
    // };
    // admin.initializeApp({
    //     credential: admin.credential.cert(serviceAccount)
    // });
    admin.initializeApp();
    
}
export {app, initFirebaseAdmin};