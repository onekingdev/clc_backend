import * as functions from "firebase-functions";
import {connect} from "../config";
import {Topics} from "../entities/Topics";
import {Lessons} from "../entities/Lessons";
import {Questions} from "../entities/Questions";
import {Library} from "../entities/Library";
import {Users} from "../entities/Users";
const cors = require('cors')({origin: true});

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

export const dropUsers = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        await connection.createQueryBuilder()
            .delete()
            .from(Users)
            .execute()

        response.send();
    })
});