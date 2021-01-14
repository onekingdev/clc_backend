import * as functions from 'firebase-functions';
import {connect} from '../config';
import {Users} from '../entities/Users';
import {ActivationCodes} from '../entities/ActivationCodes';
const cors = require('cors')({origin: true});

export const validateCode = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
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
    })
});

export const createUser = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const {activationCode, email, userName, stringID} = request.body;

        try {
            const connection = await connect();
            const repoUsers = connection.getRepository(Users);
            const repoActivationCodes = connection.getRepository(ActivationCodes);
            const code = await repoActivationCodes.findOne({code: activationCode});

            const type = () => {
                switch (code.code) {
                    case 'PREMIUM2021':
                        return 'premium';
                    case 'ADMIN2021':
                        return 'admin';
                    case 'TESTER2021':
                        return 'tester';
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
    })
});

export const getUserByEmail = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const {email} = request.body;
        const connection = await connect();
        const repo = connection.getRepository(Users);

        const all = await repo.findOne({email: email});

        response.send(all);
    })
});

export const getCodes = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(ActivationCodes);

        const all = await repo.find();

        response.send(all);
    })
});