import * as functions from 'firebase-functions';
import {connect} from './config';
import {Users} from './entities/Users';
import {ActivationCodes} from './entities/ActivationCodes';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

/*export const createActivationCode = functions.https.onRequest(async (request, response) => {
    try {
        const connection = await connect();
        const repo = connection.getRepository(ActivationCodes);

        const newActivationCode = new ActivationCodes();
        newActivationCode.active = true;
        newActivationCode.code = 'FREE2020';
        newActivationCode.createdAt = new Date();

        const saved = await repo.save(newActivationCode);

        response.send(saved);
    } catch (e) {
        response.send(e);
    }
});
*/

export const createUser = functions.https.onRequest(async (request, response) => {
    const {activationCode, email, userName} = request.body;

    try {
        const connection = await connect();
        const repoUsers = connection.getRepository(Users);
        const repoActivationCodes = connection.getRepository(ActivationCodes);

        const code = await repoActivationCodes.findOne({code: activationCode});

        const type = () => {
            switch (code.code) {
                case 'PREMIUM2020':
                    return 'premium';
                case 'ADMIN2020':
                    return 'admin';
                default:
                    return 'free';
            }
        };

        const newUser = new Users();
        newUser.activationCodeID = code.id;
        newUser.avatar = 0;
        newUser.userName = userName;
        newUser.email = email;
        newUser.type = type();
        newUser.masteredLevel = 0;
        newUser.createdAt = new Date();


        const saved = await repoUsers.save(newUser);

        response.send(saved);
    } catch (e) {
        response.send(e);
    }
});

export const getUsers = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repo = connection.getRepository(Users);

    const all = await repo.find();

    response.send(all);
});