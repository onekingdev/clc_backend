import * as functions from 'firebase-functions';
import {connect} from '../config';
import {Topics} from '../entities/Topics';
import {Lessons} from '../entities/Lessons';
import {Questions} from '../entities/Questions';
import {Users} from "../entities/Users";
import {compareValues} from "../helpers/parser";
const cors = require('cors')({origin: true});

export const uploadContent = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        const repoTopics = connection.getRepository(Topics);
        const repoLessons = connection.getRepository(Lessons);
        const repoQuestions = connection.getRepository(Questions);

        const {lessons, questions, topics} = request.body;

        (topics as Array<Object> || []).forEach(async value => {
            await repoTopics.save({...value, createdAt: new Date()});
        });

        (lessons as Array<Object> || []).forEach(async (value: any) => {
            await repoLessons.save({...value, createdAt: new Date()});
        });

        (questions as Array<Object> || []).forEach(async (value: any) => {
            await repoQuestions.save({...value, createdAt: new Date()});
        });

        response.send({success: 200})
    })
});

export const getUsersData = async (request) => {
    const {email} = request.body;
    const connection = await connect();
    const repo = connection.getRepository(Users);

    const one = await repo.findOne({email: email});

    return one;
}

export const getLessonData = async (uid: string, myTopics?: any) => {
    const connection = await connect();
    const repo = connection.getRepository(Lessons);

    const all = await repo.find({topicUID: uid});
    let current: any;

    const results = all.sort(compareValues('order', 'asc'));

    if (myTopics) {
        const topicIndex = myTopics.findIndex(t => t.UID === uid);
        if (topicIndex !== -1 && myTopics[topicIndex].lessons.length > 0) {
            myTopics[topicIndex].lessons.forEach((lesson, index) => {
                if (!lesson.mastered) {
                    current = lesson;
                } else if (myTopics[topicIndex].lessons.length-1 === index) {
                    current = results[index+1]
                }
            })
        } else current = results[0]
    } else current = results[0]

    return {total:results.length, current, all: results};
}

export const getPaths = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const {myTopics} = request.body;

        const connection = await connect();
        const repo = connection.getRepository(Topics);

        const user: any = await getUsersData(request);

        const all = await repo.find();

        let available = [], locked = [], mastered = [];

        if (myTopics.length > 0) {
            for (let i = 0; i < all.length; i++) {
                const lessonData = await getLessonData(all[i].UID, myTopics);

                if (myTopics.some(myTopic => myTopic.id === all[i].id && myTopic.mastered)) {
                    all[i]['status'] = 2;
                    all[i]['lessonUID'] = lessonData.current.UID;
                    all[i]['lessonName'] = lessonData.current.name ? lessonData.current.name : lessonData.current.lessonName;
                    all[i]['rule'] = lessonData.current.rule;
                    all[i]['allTopicLessons'] = lessonData.all;
                    all[i]['totalTopicLessons'] = lessonData.total;
                    mastered.push(all[i]);
                } else if (myTopics.some(myTopic => myTopic.id === all[i].id && !myTopic.mastered) || all[i].chips === 0 && all[i].tickets === 0 && all[i].masteredLevel <= user.masteredLevel) {
                    all[i]['status'] = 1;
                    all[i]['lessonUID'] = lessonData.current.UID;
                    all[i]['lessonName'] = lessonData.current.name ? lessonData.current.name : lessonData.current.lessonName;
                    all[i]['rule'] = lessonData.current.rule;
                    all[i]['allTopicLessons'] = lessonData.all;
                    all[i]['totalTopicLessons'] = lessonData.total;
                    available.push(all[i]);
                } else {
                    all[i]['status'] = 0;
                    all[i]['lessonName'] = lessonData.current.name ? lessonData.current.name : lessonData.current.lessonName;
                    locked.push(all[i]);
                }
            }
        } else {
            for (let i = 0; i < all.length; i++) {
                const lessonData = await getLessonData(all[i].UID);

                if (all[i].masteredLevel <= user.masteredLevel) {
                    all[i]['status'] = 1;
                    all[i]['lessonUID'] = lessonData.current.UID;
                    all[i]['lessonName'] = lessonData.current.name;
                    all[i]['rule'] = lessonData.current.rule;
                    all[i]['allTopicLessons'] = lessonData.all;
                    all[i]['totalTopicLessons'] = lessonData.total;
                    available.push(all[i]);
                } else {
                    all[i]['status'] = 0;
                    all[i]['lessonName'] = lessonData.current.name;
                    locked.push(all[i]);
                }
            }
        }

        response.send({available, locked, mastered});
    })
});