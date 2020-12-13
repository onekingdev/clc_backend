import * as functions from 'firebase-functions';
import {connect} from './config';
import {Users} from './entities/Users';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const getUsers = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repo = connection.getRepository(Users);

    const all = await repo.find();

    response.send(all);
});