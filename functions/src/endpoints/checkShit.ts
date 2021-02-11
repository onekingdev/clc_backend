import * as functions from "firebase-functions";
import {connect} from "../config";
import {ActivationCodes} from "../entities/ActivationCodes";
import {Questions} from "../entities/Questions";
import {Users} from "../entities/Users";
const cors = require('cors')({origin: true});

export const check = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Questions);

        const all = await repo.find({assessment: 1});

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

/*export const addAssessment = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Users);

        const all = await repo.find();

        all.forEach(item => {
            item.assessment = true;
        })

        await connection.createQueryBuilder()
            .delete()
            .from(Users)
            .execute()

        await repo.save(all);

        response.send();
    });
});*/

export const checkUsers = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Users);

        const all = await repo.find();

        response.send(all);
    });
});