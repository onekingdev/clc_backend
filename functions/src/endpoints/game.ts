import * as functions from 'firebase-functions';
import {connect} from '../config';
import {Earnings} from "../entities/Earnings";
import {Questions} from "../entities/Questions";
import {parseHandHistory} from "../helpers/parser";
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

export const getTotalLessons = async (topicUID) => {
    const connection = await connect();
    let sum = await connection
        .createQueryBuilder(Lessons, 'lessons')
        .addSelect('topics.UID', 'topics_UID')
        .addSelect('lessons.UID', 'lessons_UID')
        .innerJoin(Topics, 'topics', 'lessons.topicUID = topics.UID')
        .where('topics.UID = :UID')
        .setParameters({UID: topicUID})
        .getCount()

    return sum;
}

export const getQuestionsAI = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        const {user} = request.body;
        const repo = connection.getRepository(Users);
        let thisUser = await repo.findOne({id: user.id});

        let all;
        if (thisUser.path.masteredLessons.length > 0) {
            all = await connection
                .createQueryBuilder(Questions, 'questions')
                .addSelect('topics.id', 'topics_id')
                .addSelect('topics.UID', 'topics_UID')
                .addSelect('topics.name', 'topics_name')
                .addSelect('topics.chips', 'topics_chips')
                .addSelect('topics.tickets', 'topics_tickets')
                .addSelect('topics.masteredLevel', 'topics_masteredLevel')
                .addSelect('lessons.UID', 'lessons_UID')
                .addSelect('lessons.name', 'lessons_name')
                .addSelect('lessons.rule', 'lessons_rule')
                .addSelect('lessons.description', 'lessons_description')
                .innerJoin(Lessons, 'lessons', 'questions.lessonUID = lessons.UID')
                .innerJoin(Topics, 'topics', 'lessons.topicUID = topics.UID')
                .where('topics.UID IN (:...availableTopics)')
                .andWhere('lessons.UID NOT IN (:...masteredLessons)')
                .setParameters({availableTopics: thisUser.path.availableTopics})
                .setParameters({masteredLessons: thisUser.path.masteredLessons})
                .limit(500)
                .getRawMany()
        } else {
            all = await connection
                .createQueryBuilder(Questions, 'questions')
                .addSelect('topics.id', 'topics_id')
                .addSelect('topics.UID', 'topics_UID')
                .addSelect('topics.name', 'topics_name')
                .addSelect('topics.chips', 'topics_chips')
                .addSelect('topics.tickets', 'topics_tickets')
                .addSelect('topics.masteredLevel', 'topics_masteredLevel')
                .addSelect('lessons.UID', 'lessons_UID')
                .addSelect('lessons.name', 'lessons_name')
                .addSelect('lessons.rule', 'lessons_rule')
                .addSelect('lessons.description', 'lessons_description')
                .innerJoin(Lessons, 'lessons', 'questions.lessonUID = lessons.UID')
                .innerJoin(Topics, 'topics', 'lessons.topicUID = topics.UID')
                .where('topics.UID IN (:...availableTopics)')
                .setParameters({availableTopics: thisUser.path.availableTopics})
                .limit(500)
                .getRawMany()
        }

        let data = [];

        all.sort(() => .5 - Math.random());

        for (let i = 0; i < 20; i++) {
            data.push({
                ...parseHandHistory(all[i]['questions_handHistory']),
                topicData: {
                    id: all[i]['topics_id'],
                    UID: all[i]['topics_UID'],
                    name: all[i]['topics_name'],
                    masteredLevel: all[i]['topics_masteredLevel'],
                    chips: all[i]['topics_chips'],
                    tickets: all[i]['topics_tickets'],
                    status: 1,
                    mastered: false,
                    lessonUID: all[i]['lessons_UID'],
                    lessonName: all[i]['lessons_name'],
                    lessonDescription: all[i]['lessons_description'],
                    rule: all[i]['lessons_rule'],
                    totalTopicLessons:  await getTotalLessons(all[i]['topics_UID'])
                },
                question: {
                    questionID: all[i]['questions_id'],
                    reward: JSON.parse(all[i]['questions_reward']),
                    description: all[i]['questions_questionText'],
                    header: all[i]['lessons_name'],
                    questionNumber: i+1,
                    answers: [
                        {
                            correct: true,
                            text: JSON.parse(all[i]['questions_answers']).correct,
                            explanation: JSON.parse(all[i]['questions_explanation']).correct
                        },
                        {
                            correct: false,
                            text: JSON.parse(all[i]['questions_answers']).wrong1,
                            explanation: JSON.parse(all[i]['questions_explanation']).wrong
                        },
                        {
                            correct: false,
                            text: JSON.parse(all[i]['questions_answers']).wrong2,
                            explanation: JSON.parse(all[i]['questions_explanation']).wrong
                        },
                        {
                            correct: false,
                            text: JSON.parse(all[i]['questions_answers']).wrong3,
                            explanation: JSON.parse(all[i]['questions_explanation']).wrong
                        },
                        JSON.parse(all[i]['questions_answers']).wrong4 ? {
                            correct: false,
                            text: JSON.parse(all[i]['questions_answers']).wrong4,
                            explanation: JSON.parse(all[i]['questions_explanation']).wrong
                        } : {}
                    ]
                }
            })
        }
        response.send(data);
    })
})

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
                    totalTopicLessons: 0
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
        const {type, myTopics, UID, user} = request.body;

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

            case 'game':
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
                    .where('t2.UID = :lessonUID')
                    .setParameters({ lessonUID: UID })
                    .getRawMany()
                break;

            case 'ai':
                all = await connection
                    .createQueryBuilder(Earnings, 't0')
                    .addSelect('t3.id', 't3_id')
                    .addSelect('t3.UID', 't3_UID')
                    .addSelect('t3.name', 't3_name')
                    .addSelect('t3.chips', 't3_chips')
                    .addSelect('t3.tickets', 't3_tickets')
                    .addSelect('t3.masteredLevel', 't3_masteredLevel')
                    .addSelect('t2.UID', 't2_UID')
                    .addSelect('t2.name', 't2_name')
                    .addSelect('t2.rule', 't2_rule')
                    .addSelect('t1.id', 't1_id')
                    .innerJoin(Questions, 't1', 't0.questionID = t1.id')
                    .innerJoin(Lessons, 't2', 't1.lessonUID = t2.UID')
                    .innerJoin(Topics, 't3', 't2.topicUID = t3.UID')
                    .where('t0.challenge = 1')
                    .andWhere('t0.createdAt >= CURDATE()')
                    .andWhere('t0.userID = :userID')
                    .setParameters({ userID: user.id })
                    .getRawMany()
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

        if (type === 'ai') {
            if (all.length < user.dailyChallenge.questions) {
                for(let i = 0; i < user.dailyChallenge.questions - all.length; i++) {
                    progressData.push({
                        id: null,
                        correct: null
                    })
                }
            }
            totalQuestions = progressData.length;
        }

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

        const {userID, questionID, tickets, chips, challenge, correct} = request.body;

        await repoEarnings.save({userID, questionID, tickets, chips, challenge, correct})

        response.send(200);
    })
});

export const levelUp = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Users);

        const {id, UID} = request.body;

        let user = await repo.findOne({id: id});

        user.masteredLevel += 1;
        const index = user.path.availableTopics.findIndex((t: string) => t === UID);
        if (index !== -1) user.path.availableTopics.splice(index, 1);
        user.path.masteredTopics.push(UID);

        const allLocked = (await connection
            .createQueryBuilder(Topics, 'topics')
            .select(['topics.UID'])
            .where('topics.masteredLevel = :masteredLevel')
            .andWhere('topics.tickets = 0')
            .andWhere('topics.chips = 0')
            .setParameters({ masteredLevel: 2 })
            .getRawMany()).map(t => t.topics_UID);

        allLocked.forEach(t => {
            const index = user.path.lockedTopics.findIndex((t: string) => t === UID);
            if (index === -1) return;
            user.path.lockedTopics.splice(index, 1);
            user.path.availableTopics.push(t.UID);
        })

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

export const updateMasteredLessons = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Users);

        const {id, UID} = request.body;

        let user = await repo.findOne({id: id});

        user.path.masteredLessons.push(UID);

        await repo.save(user);

        response.send();
    })
})