import * as functions from 'firebase-functions';
import {connect} from '../config';
import { Lessons } from '../entities/Lessons';
import { Library } from '../entities/Library';
import { Questions } from '../entities/Questions';
import { Topics } from '../entities/Topics';

export const fetchLibrary = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    
    const repoLibrary = connection.getRepository(Library);
    response.send( {
        faq: await repoLibrary.find({ type: 'faq' }),
        usage: await repoLibrary.find({ type: 'usage' })
    });
});

export const uploadLibrary = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    
    const repoTopics = connection.getRepository(Topics);
    const repoLessons = connection.getRepository(Lessons);
    const repoQuestions = connection.getRepository(Questions);
    const repoLibrary = connection.getRepository(Library);

    const {lessons, questions, topics, library} = request.body;

    (lessons as Array<Object> || []).forEach(async value => {
        await repoLessons.save(value);
    });

    (questions as Array<Object> || []).forEach(async value => {
        await repoQuestions.save(value);
    });

    (topics as Array<Object> || []).forEach(async value => {
        await repoTopics.save(value);
    });

    (library as Array<Object> || []).forEach(async value => {
        await repoLibrary.save({...value, createdAt: new Date()});
    });
});
