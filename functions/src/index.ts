import * as functions from 'firebase-functions';
import {connect} from './config';
import {Users} from './entities/Users';
import {ActivationCodes} from './entities/ActivationCodes';
import {Topics} from './entities/Topics';

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
        newActivationCode.code = 'ADMIN2020';
        newActivationCode.createdAt = new Date();

        const saved = await repo.save(newActivationCode);

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

*/

export const validateCode = functions.https.onRequest(async (request, response) => {
    const {activationCode} = request.body;

    const connection = await connect();
    const repo = connection.getRepository(ActivationCodes);

    let result: object = await repo.findOne({
        where: {
            code: activationCode
        }
    });

    if (!result) result = {error: 403};

    response.send(result);
});

export const createUser = functions.https.onRequest(async (request, response) => {
    const {activationCode, email, userName, stringID} = request.body;

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
        newUser.avatar = '';
        newUser.userName = userName;
        newUser.email = email;
        newUser.type = type();
        newUser.masteredLevel = 1;
        newUser.createdAt = new Date();
        newUser.stringID = stringID;

        const saved = await repoUsers.save(newUser);

        response.send(saved);
    } catch (e) {
        response.send(e);
    }
});

export const getUserByEmail = functions.https.onRequest(async (request, response) => {
    const {email} = request.body;
    const connection = await connect();
    const repo = connection.getRepository(Users);

    const all = await repo.findOne({email: email});

    response.send(all);
});

export const getCodes = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repo = connection.getRepository(ActivationCodes);

    const all = await repo.find();

    response.send(all);
});

export const getTopics = functions.https.onRequest(async (request, response) => {
    const {myTopics}  = request.body;

    const connection = await connect();
    const repo = connection.getRepository(Topics);

    const user: any = await getUserByEmail(request, response);
    const all = await repo.find();

    let available = [], locked = [], mastered = [];

    if (myTopics.length) {
        all.forEach(topic => {
            if (myTopics.some(myTopic => myTopic.id === topic.id && myTopic.mastered)) {
                topic['status'] = 2;
                topic['lessonName'] = '';
                mastered.push(topic);
            } else if (myTopics.some(myTopic => myTopic.id === topic.id) || topic.chips === 0 && topic.tickets === 0 && topic.masteredLevel <= user.masteredLevel) {
                topic['status'] = 1;
                topic['lessonName'] = '';
                available.push(topic);
            } else {
                topic['status'] = 0;
                topic['lessonName'] = '';
                locked.push(topic);
            }
        });
    }
    response.send({available, locked, mastered});
});