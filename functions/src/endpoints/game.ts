import * as functions from 'firebase-functions';
import {connect} from '../config';
import {Earnings} from "../entities/Earnings";
import {Questions} from "../entities/Questions";
import {parseHandHistory} from "../helpers/parser";

export const getQuestions = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repoQuestions = connection.getRepository(Questions);
    const {UID, name} = request.body;

    const all = await repoQuestions.find({lessonUID: UID});
    const data = [];

    for (let i = 0; i < all.length; i++) {
        data.push({
            ...parseHandHistory(all[i].handHistory),
            question: {
                questionID: all[i].id,
                reward: all[i].reward,
                description: all[i].questionText,
                header: name,
                questionNumber: i+1,
                answers: [
                    {
                        correct: true,
                        text: all[i].answers.correct,
                        explanation: all[i].explanation.correct
                    },
                    {
                        correct: false,
                        text: all[i].answers.wrong1,
                        explanation: all[i].explanation.wrong
                    },
                    {
                        correct: false,
                        text: all[i].answers.wrong2,
                        explanation: all[i].explanation.wrong
                    },
                    {
                        correct: false,
                        text: all[i].answers.wrong3,
                        explanation: all[i].explanation.wrong
                    },
                    all[i].answers.wrong4 ? {
                        correct: false,
                        text: all[i].answers.wrong4,
                        explanation: all[i].explanation.wrong
                    } : {}
                ]
            }
        })
        // data[i].answers.sort(() => .5 - Math.random());
    }

    response.send(data)
});

export const saveEarnings = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repoEarnings = connection.getRepository(Earnings);

    const {userID, questionID, tickets, chips} = request.body;

    await repoEarnings.save({userID, questionID, tickets, chips, createdAt: new Date()})

    response.send(200);
});









export const check = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repo = connection.getRepository(Questions);

    const all = await repo.find();

    response.send(all);
});

export const deleteTable = functions.https.onRequest(async (request, response) => {
    const connection = await connect();

    connection.createQueryBuilder()
        .delete()
        .from(Questions)
        .where({lessonUID: 'L001'})
        .execute()

    response.send();
});