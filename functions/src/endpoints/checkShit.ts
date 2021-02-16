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
            item.payment = {id: '', created: 0, amount: 0, subscription: new Date()};
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

export const setAssessment = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Users);

        let user = await repo.findOne({id: 58});

        user.assessment = true;

        await repo.save(user);

        response.send(user);
    })
});


export const checkUser = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repoUsers = connection.getRepository(Users);
        let user = await repoUsers.findOne({id: 58});

        response.send(user);
    })
});
