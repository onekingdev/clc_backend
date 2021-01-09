import * as functions from 'firebase-functions';
import {connect} from '../config';
import { Lessons } from '../entities/Lessons';
import { Questions } from '../entities/Questions';
import { Topics } from '../entities/Topics';
import {Library} from "../entities/Library";
const cors = require('cors')({origin: true});

export const uploadQuestions = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        const repoQuestions = connection.getRepository(Questions);
        const repoTopics = connection.getRepository(Topics);
        const repoLessons = connection.getRepository(Lessons);

        const {questions, lessons, topics} = request.body;
        try {

            const newTopics: Array<Object> = (topics as Array<Object> || []).map(async value => {
                await repoTopics.save({...value, createdAt: new Date()});
            });
            const newLessons: Array<Object> = (lessons as Array<Object> || []).map(async (value: any) => {
                await repoLessons.save({...value, createdAt: new Date(), topicID: newTopics[value.topicRow - 1]['id']});
            });

            (questions as Array<Object> || []).map(async (value: any) => {
                await repoQuestions.save({
                    ...value,
                    createdAt: new Date(),
                    lessonID: newLessons[value.lessonRow - 1]['id']
                });
            });

            response.send({message: 'success'})
        } catch (error) {
            response.send({error: error})
        }
    });
});

export const dropTopics = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        await connection.createQueryBuilder()
            .delete()
            .from(Topics)
            .execute()

        response.send();
    });
});

export const dropLessons = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        await connection.createQueryBuilder()
            .delete()
            .from(Lessons)
            .execute()

        response.send();
    })
});

export const dropQuestions = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        await connection.createQueryBuilder()
            .delete()
            .from(Questions)
            .execute()

        response.send();
    })
});

export const dropLibrary = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        await connection.createQueryBuilder()
            .delete()
            .from(Library)
            .execute()

        response.send();
    })
});
