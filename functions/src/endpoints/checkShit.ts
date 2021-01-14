import * as functions from "firebase-functions";
import {connect} from "../config";
import {Users} from "../entities/Users";
const cors = require('cors')({origin: true});

export const check = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();
        const repo = connection.getRepository(Users);

        const all = await repo.find();

        response.send(all);
    });
});