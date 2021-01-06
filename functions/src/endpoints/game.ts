import * as functions from 'firebase-functions';
import {LessThanOrEqual} from 'typeorm';
import {connect} from '../config';
import {Earnings} from "../entities/Earnings";
import {Questions} from "../entities/Questions";
import {compareValues, parseHandHistory} from "../helpers/parser";
import {Lessons} from "../entities/Lessons";
import {Topics} from "../entities/Topics";
import {Users} from "../entities/Users";

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

export const getQuestionsAI = functions.https.onRequest(async (request, response) => {
    const {myTopics, user}  = request.body;

    const connection = await connect();
    const repoTopics = connection.getRepository(Topics);
    const repoLessons = connection.getRepository(Lessons);
    const repoQuestions = connection.getRepository(Questions);

    const allTopics = await repoTopics.find({
        where: { masteredLevel: LessThanOrEqual(user.masteredLevel) }
    });

    let data = [];

    for (let i = 0; i < allTopics.length; i++) {
        const myTopicIndex = myTopics.findIndex(t => t.UID === allTopics[i].UID);
        if (myTopicIndex !== -1 || allTopics[i].tickets === 0 && allTopics[i].chips === 0) {
            if (myTopicIndex === -1 || !myTopics[myTopicIndex].mastered) {
                const allLessons = await repoLessons.find({topicUID: allTopics[i].UID});
                const sortedLessons = allLessons.sort(compareValues('order', 'asc'));

                for (let j = 0; j < sortedLessons.length; j++) {
                    const allQuestions = await repoQuestions.find({lessonUID: sortedLessons[j].UID});

                    for (let k = 0; k < allQuestions.length; k++) {
                        data.push({
                            ...parseHandHistory(allQuestions[k].handHistory),
                            topicData: {
                                id: allTopics[i].id,
                                UID: allTopics[i].UID,
                                name: allTopics[i].name,
                                masteredLevel: allTopics[i].masteredLevel,
                                chips: allTopics[i].chips,
                                tickets: allTopics[i].tickets,
                                status: 1,
                                mastered: false,
                                lessonUID: sortedLessons[j].UID,
                                lessonName: sortedLessons[j].name,
                                rule: sortedLessons[j].rule,
                                totalTopicLessons: sortedLessons.length
                            },
                            question: {
                                questionID: allQuestions[k].id,
                                reward: allQuestions[k].reward,
                                description: allQuestions[k].questionText,
                                header: sortedLessons[j].name,
                                questionNumber: k+1,
                                answers: [
                                    {
                                        correct: true,
                                        text: allQuestions[k].answers.correct,
                                        explanation: allQuestions[k].explanation.correct
                                    },
                                    {
                                        correct: false,
                                        text: allQuestions[k].answers.wrong1,
                                        explanation: allQuestions[k].explanation.wrong
                                    },
                                    {
                                        correct: false,
                                        text: allQuestions[k].answers.wrong2,
                                        explanation: allQuestions[k].explanation.wrong
                                    },
                                    {
                                        correct: false,
                                        text: allQuestions[k].answers.wrong3,
                                        explanation: allQuestions[k].explanation.wrong
                                    },
                                    allQuestions[k].answers.wrong4 ? {
                                        correct: false,
                                        text: allQuestions[k].answers.wrong4,
                                        explanation: allQuestions[k].explanation.wrong
                                    } : {}
                                ]
                            }
                        })
                    }
                }
            }
        }
    }

    data.sort(() => .5 - Math.random());
    response.send(data);
});

export const saveEarnings = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repoEarnings = connection.getRepository(Earnings);

    const {userID, questionID, tickets, chips} = request.body;

    await repoEarnings.save({userID, questionID, tickets, chips, createdAt: new Date()})

    response.send(200);
});


/*export const getLessonData = async (uid: string, myTopics?: any) => {
    const connection = await connect();
    const repo = connection.getRepository(Lessons);

    const all = await repo.find({topicUID: uid});
    let current: any;

    if (myTopics) {
        const topicIndex = myTopics.findIndex(t => t.UID === uid);
        if (topicIndex !== -1 && myTopics[topicIndex].lessons.length > 0) {
            myTopics[topicIndex].lessons.forEach(lesson => {
                if (!lesson.mastered) {
                    current = lesson;
                }
            })
        } else current = all[0]
    } else current = all[0]


    return {total:all.length, current, all};
}*/

export const levelUp = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repo = connection.getRepository(Users);

    const {id} = request.body;

    const user = await repo.findOne({id: id});

    user.masteredLevel += 1;

    response.send(user);
});





export const check = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repo = connection.getRepository(Lessons);

    const all = await repo.find();

    response.send(all);
});

export const deleteTable = functions.https.onRequest(async (request, response) => {
    const connection = await connect();

    connection.createQueryBuilder()
        .delete()
        .from(Topics)
        .execute()

    response.send();
});