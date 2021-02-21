import * as functions from 'firebase-functions';
import {connect} from '../config';
import {Events} from "../entities/Events";
const cors = require('cors')({origin: true});

export const getEvents = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        const repo = connection.getRepository(Events);
        const all = await repo.find();

        response.send(all);
    });
});

export const getSpotlight = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        const repo = connection.getRepository(Events);
        const all = await repo.findOne({spotlight: 1});

        response.send(all);
    });
});

export const uploadEvents = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        const repo = connection.getRepository(Events);

        const {events} = request.body;

        await repo.save(events);

        response.send({success: 200});
    });
});