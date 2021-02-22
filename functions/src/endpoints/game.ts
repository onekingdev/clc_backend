import * as functions from 'firebase-functions';
import {LessThanOrEqual} from 'typeorm';
import {connect} from '../config';
import {Earnings} from "../entities/Earnings";
import {Questions} from "../entities/Questions";
import {compareValues, parseHandHistory} from "../helpers/parser";
import {Lessons} from "../entities/Lessons";
import {Topics} from "../entities/Topics";
import {Users} from "../entities/Users";
const cors = require('cors')({origin: true});

export const getQuestions = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
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
                    questionNumber: i + 1,
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
    })
});

// TODO: fix this shit!!!!!!
export const getQuestionsAI = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const {myTopics, user} = request.body;

        const connection = await connect();
        const repoTopics = connection.getRepository(Topics);
        const repoLessons = connection.getRepository(Lessons);
        const repoQuestions = connection.getRepository(Questions);

        const allTopics = await repoTopics.find({
            where: {masteredLevel: LessThanOrEqual(user.masteredLevel)}
        });

        let data = [];

        for (let i = 0; i < allTopics.length; i++) {
            const myTopicIndex = myTopics.findIndex(t => t.UID === allTopics[i].UID);
            if (myTopicIndex !== -1 || allTopics[i].tickets === 0 && allTopics[i].chips === 0) {
                if (myTopicIndex === -1 || !myTopics[myTopicIndex].mastered) {
                    const allLessons = await repoLessons.find({topicUID: allTopics[i].UID});
                    const sortedLessons = allLessons.sort(compareValues('order', 'asc'));

                    let newLessonList = [];

                    if (myTopics[myTopicIndex]) {
                        sortedLessons.forEach(lesson => {
                            const lessonIndex = myTopics[myTopicIndex].lessons.findIndex((l: any) => l.UID === lesson.UID);
                            if (newLessonList.length < 2 && lessonIndex === -1 || newLessonList.length < 2 && !myTopics[myTopicIndex].lessons[lessonIndex].mastered) {
                                newLessonList.push(lesson);
                            }
                        })
                    } else {
                        newLessonList.push(sortedLessons[0]);
                        newLessonList.push(sortedLessons[1]);
                    }

                    for (let j = 0; j < newLessonList.length; j++) {
                        const allQuestions = await repoQuestions.find({lessonUID: newLessonList[j].UID});

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
                                    lessonUID: newLessonList[j].UID,
                                    lessonName: newLessonList[j].name,
                                    lessonDescription: newLessonList[j].description,
                                    rule: newLessonList[j].rule,
                                    totalTopicLessons: newLessonList.length
                                },
                                question: {
                                    questionID: allQuestions[k].id,
                                    reward: allQuestions[k].reward,
                                    description: allQuestions[k].questionText,
                                    header: newLessonList[j].name,
                                    questionNumber: k + 1,
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
    })
});

export const getQuestionsAssessment = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const {myTopics} = request.body;

        const all = await connection
            .createQueryBuilder(Questions, 't1')
            .addSelect('t3.id', 't3_id')
            .addSelect('t3.UID', 't3_UID')
            .addSelect('t3.name', 't3_name')
            .addSelect('t3.chips', 't3_chips')
            .addSelect('t3.tickets', 't3_tickets')
            .addSelect('t3.masteredLevel', 't3_masteredLevel')
            .addSelect('t2.UID', 't2_UID')
            .addSelect('t2.name', 't2_name')
            .addSelect('t2.rule', 't2_rule')
            .addSelect('t2.description', 't2_description')
            .innerJoin(Lessons, 't2', 't1.lessonUID = t2.UID')
            .innerJoin(Topics, 't3', 't2.topicUID = t3.UID')
            .where('t1.assessment = 1')
            .getRawMany()

        let filteredQuestions = all;
        const data = [];

        myTopics.forEach(topic => {
            if (topic.lessons) {
                topic.lessons.forEach(lesson => {
                    lesson.questions.forEach(question => {
                        all.forEach((q, index) => {
                            if (question.id === q['t1_id']) {
                                filteredQuestions.splice(index, 1);
                            }
                        })
                    })
                })
            }
        })

        for (let i = 0; i < filteredQuestions.length; i++) {
            data.push({
                ...parseHandHistory(filteredQuestions[i]['t1_handHistory']),
                topicData: {
                    id: parseInt(filteredQuestions[i]['t3_id']),
                    UID: filteredQuestions[i]['t3_UID'],
                    name: filteredQuestions[i]['t3_name'],
                    masteredLevel: filteredQuestions[i]['t3_masteredLevel'],
                    chips: parseInt(filteredQuestions[i]['t3_chips']),
                    tickets: parseInt(filteredQuestions[i]['t3_tickets']),
                    status: 1,
                    mastered: false,
                    lessonUID: filteredQuestions[i]['t2_UID'],
                    lessonName: filteredQuestions[i]['t2_name'],
                    lessonDescription: filteredQuestions[i]['t2_description'],
                    rule: all[i]['t2_rule'],
                    totalTopicLessons: filteredQuestions.length
                },
                question: {
                    questionID: parseInt(filteredQuestions[i]['t1_id']),
                    reward: JSON.parse(filteredQuestions[i]['t1_reward']),
                    description: filteredQuestions[i]['t1_questionText'],
                    header: filteredQuestions[i]['t2_name'],
                    questionNumber: i + 1,
                    answers: [
                        {
                            correct: true,
                            text: JSON.parse(filteredQuestions[i]['t1_answers']).correct,
                            explanation: JSON.parse(filteredQuestions[i]['t1_explanation']).correct
                        },
                        {
                            correct: false,
                            text: JSON.parse(filteredQuestions[i]['t1_answers']).wrong1,
                            explanation: JSON.parse(filteredQuestions[i]['t1_explanation']).wrong
                        },
                        {
                            correct: false,
                            text: JSON.parse(filteredQuestions[i]['t1_answers']).wrong2,
                            explanation: JSON.parse(filteredQuestions[i]['t1_explanation']).wrong
                        },
                        {
                            correct: false,
                            text: JSON.parse(filteredQuestions[i]['t1_answers']).wrong3,
                            explanation: JSON.parse(filteredQuestions[i]['t1_explanation']).wrong
                        },
                        JSON.parse(filteredQuestions[i]['t1_answers']).wrong4 ? {
                            correct: false,
                            text: JSON.parse(filteredQuestions[i]['t1_answers']).wrong4,
                            explanation: JSON.parse(filteredQuestions[i]['t1_explanation']).wrong
                        } : {}
                    ]
                }
            })
            // data[i].answers.sort(() => .5 - Math.random());
        }

        response.send(data)
    })
});

export const getQuestionsProgressbar = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repoQuestions = connection.getRepository(Questions);
        const {type, myTopics, UID} = request.body;

        let all,
            progressIndex = 0,
            ticketsEarned = 0,
            chipsEarned = 0,
            correctQuestions = 0,
            totalQuestions = 0,
            progressData = [];

        switch (type) {
            case 'assessment':
                all = await connection
                    .createQueryBuilder(Questions, 't1')
                    .addSelect('t3.id', 't3_id')
                    .addSelect('t3.UID', 't3_UID')
                    .addSelect('t3.name', 't3_name')
                    .addSelect('t3.chips', 't3_chips')
                    .addSelect('t3.tickets', 't3_tickets')
                    .addSelect('t3.masteredLevel', 't3_masteredLevel')
                    .addSelect('t2.UID', 't2_UID')
                    .addSelect('t2.name', 't2_name')
                    .addSelect('t2.rule', 't2_rule')
                    .innerJoin(Lessons, 't2', 't1.lessonUID = t2.UID')
                    .innerJoin(Topics, 't3', 't2.topicUID = t3.UID')
                    .where('t1.assessment = 1')
                    .getRawMany()
                break;

            case 'lesson':
                all = await repoQuestions.find({lessonUID: UID});
                break;
        }

        totalQuestions = all.length;

        all.forEach((q, i) => {
            const myTopicsIndex = myTopics.findIndex((t: any) => t.UID === q['t3_UID']);
            if (myTopicsIndex !== -1) {
                const lessonIndex = myTopics[myTopicsIndex].lessons.findIndex((l: any) => l.UID === q['t2_UID'])

                if (lessonIndex !== -1) {
                    const questionIndex = myTopics[myTopicsIndex].lessons[lessonIndex].questions.findIndex((question: any) => q['t1_id'] === question.id)

                    if (questionIndex !== -1) {
                        progressData.push({
                            id: myTopics[myTopicsIndex].lessons[lessonIndex].questions[questionIndex].id,
                            correct: myTopics[myTopicsIndex].lessons[lessonIndex].questions[questionIndex].correct
                        })
                        if (myTopics[myTopicsIndex].lessons[lessonIndex].questions[questionIndex].correct) {
                            correctQuestions += myTopics[myTopicsIndex].lessons[lessonIndex].questions[questionIndex].correct
                        }
                        progressIndex = i+1;

                    } else {
                        progressData.push({
                            id: q['t1_id'],
                            correct: null
                        })
                    }
                } else {
                    progressData.push({
                        id: q['t1_id'],
                        correct: null
                    })
                }
            } else {
                progressData.push({
                    id: q['t1_id'],
                    correct: null
                })
            }
        })

        response.send({
            progressIndex,
            ticketsEarned,
            chipsEarned,
            correctQuestions,
            totalQuestions,
            progressData
        });
    })
});

export const saveEarnings = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repoEarnings = connection.getRepository(Earnings);

        const {userID, questionID, tickets, chips} = request.body;

        await repoEarnings.save({userID, questionID, tickets, chips, createdAt: new Date()})

        response.send(200);
    })
});


export const levelUp = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Users);

        const {id} = request.body;

        let user = await repo.findOne({id: id});

        user.masteredLevel += 1;

        await repo.save(user);

        response.send(user);
    })
});

export const finishAssessment = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Users);

        const {id} = request.body;

        let user = await repo.findOne({id: id});

        user.assessment = false;

        await repo.save(user);

        response.send(user);
    })
})