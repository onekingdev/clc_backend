import * as functions from 'firebase-functions';
import {connect} from '../config';
import {Glossary} from "../entities/Glossary";
import {applyMiddleware} from "../middleware"


export const getGlossary = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
        const connection = await connect();
        const repo = connection.getRepository(Glossary);

        const all = await repo.find();

        response.send(all);
    });
});

export const uploadGlossary = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
        const connection = await connect();
        const repoGlossary = connection.getRepository(Glossary);
        const {glossary} = request.body;

        await repoGlossary.save(glossary);

        response.send({success: 200})
    });
});