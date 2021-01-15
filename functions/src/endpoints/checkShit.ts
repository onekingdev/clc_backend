import * as functions from "firebase-functions";
import {connect} from "../config";
import {ActivationCodes} from "../entities/ActivationCodes";
const cors = require('cors')({origin: true});

export const check = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(ActivationCodes);

        const all = await repo.find();

        response.send(all);
    });
});

export const addActivationCode = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(ActivationCodes);

        repo.save({
            code: 'TESTER2021',
            active: true,
            createdAt: new Date()
        })

        response.send();
    });
});