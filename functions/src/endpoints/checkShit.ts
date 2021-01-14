import * as functions from "firebase-functions";
import {connect} from "../config";
import {Lessons} from "../entities/Lessons";
const cors = require('cors')({origin: true});

export const check = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Lessons);

        const all = await repo.find();

        response.send(all);
    });
});