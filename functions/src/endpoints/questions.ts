import * as functions from 'firebase-functions';
import {connect} from '../config';
import { Lessons } from '../entities/Lessons';
import { Questions } from '../entities/Questions';
import { Topics } from '../entities/Topics';

export const uploadQuestions = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repoQuestions = connection.getRepository(Questions);
    const repoTopics = connection.getRepository(Topics);
    const repoLessons = connection.getRepository(Lessons);

    const {questions, lessons, topics} = request.body;
    try {
        (lessons as Array<Object> || []).forEach(async value => {
            await repoLessons.save(value);
        });

        (questions as Array<Object> || []).forEach(async value => {
            await repoQuestions.save(value);
        });

        (topics as Array<Object> || []).forEach(async value => {
            await repoTopics.save(value);
        });

        (questions as Array<Object> || []).forEach(async value => {
            await repoQuestions.save(value);
        });
        response.send({message: 'success'})
    } catch (error) {
        response.send({error: error})
    }
});
