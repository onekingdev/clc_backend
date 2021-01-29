import * as functions from 'firebase-functions';
import {connect} from '../config';
import {Glossary} from "../entities/Glossary";
const cors = require('cors')({origin: true});

export const getGlossary = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Glossary);

        const all = await repo.find();

        response.send(all);
    });
});

export const uploadGlossary = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repoGlossary = connection.getRepository(Glossary);
        const {glossary} = request.body;

        (glossary as Array<Object> || []).forEach(async (value: any) => {
            await repoGlossary.save({
                ...value,
                createdAt: new Date()
            });
        });

        response.send({success: 200})
    });
});