import * as functions from 'firebase-functions';
import {connect} from '../config';
import {Topics} from '../entities/Topics';
import {getUserByEmail} from './auth';

export const getTopics = functions.https.onRequest(async (request, response) => {
    const {myTopics}  = request.body;

    const connection = await connect();
    const repo = connection.getRepository(Topics);

    const user: any = await getUserByEmail(request, response);
    const all = await repo.find();

    let available = [], locked = [], mastered = [];

    if (myTopics.length) {
        all.forEach(topic => {
            if (myTopics.some(myTopic => myTopic.id === topic.id && myTopic.mastered)) {
                topic['status'] = 2;
                topic['lessonName'] = '';
                mastered.push(topic);
            } else if (myTopics.some(myTopic => myTopic.id === topic.id) || topic.chips === 0 && topic.tickets === 0 && topic.masteredLevel <= user.masteredLevel) {
                topic['status'] = 1;
                topic['lessonName'] = '';
                available.push(topic);
            } else {
                topic['status'] = 0;
                topic['lessonName'] = '';
                locked.push(topic);
            }
        });
    }
    response.send({available, locked, mastered});
});