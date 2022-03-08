import * as functions from "firebase-functions";
import {connect} from "../config";
import {ActivationCodes} from "../entities/ActivationCodes";
import {Users} from "../entities/Users";
import Stripe from "stripe";
import {applyMiddleware} from "../middleware"

// @ts-ignore
const stripe = new Stripe('sk_test_V09bhnBnCKBDwLD6gMha7WgG');

export const check = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
        const subscriptionSchedule = await stripe.subscriptions.retrieve(
            'sub_J7Z8SX1rzyPb6X'
        );
        /*const paymentMethod = await stripe.paymentMethods.attach(
            'pm_1IVC6wAT9ya87fpTm4xn4I1C',
            {customer: 'cus_J7Z8GHTRs4uccX'}
        );

        const paymentMethods = await stripe.paymentMethods.list({
            customer: 'cus_J7Qz9MByu4DMGz',
            type: 'card',
        });*/

        response.send(subscriptionSchedule);
    });
});

export const addActivationCode = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
        const { code, isActive } = request.body;
        const connection = await connect();
        const repo = connection.getRepository(ActivationCodes);

        const saved = await repo.save({
            code: code,
            active: isActive,
            createdAt: new Date()
        })

        response.send(saved);
    });
});

/*export const addAssessment = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
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
    applyMiddleware(request, response, async () =>{
        const connection = await connect();
        const repo = connection.getRepository(Users);

        const all = await repo.find();

        response.send(all);
    });
});

export const setAssessment = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
        const connection = await connect();
        const repo = connection.getRepository(Users);
        const { id } = request.body;

        let user = await repo.findOne({id: id});

        user.assessment = true;

        await repo.save(user);

        response.send(user);
    })
});

export const fixAssessment = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
        const connection = await connect();
        const repo = connection.getRepository(Users);
        const { id } = request.body;

        let user = await repo.findOne({id: id});

        user.assessment = false;

        await repo.save(user);

        response.send(user);
    })
});


export const checkUser = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
        const connection = await connect();
        const repoUsers = connection.getRepository(Users);
        const { id } = request.body;
        let user = await repoUsers.findOne({id: id});

        response.send(user);
    })
});
