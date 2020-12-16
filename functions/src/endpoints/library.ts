import * as functions from 'firebase-functions';
import {connect} from '../config';
import { Library } from '../entities/Library';

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
    
    const repoLibrary = connection.getRepository(Library);

    const { library } = request.body;

    console.log(library);
    try {
        var inserted = [];
        for (var i=0; i <  (library as Array<Object> || []).length; i++) {
            inserted.push(await repoLibrary.create(library[i]));
        }
        console.log(inserted);
        response.send({ message: 'sucess', library: inserted });
    } catch (error) {
        response.send({ error: error })
    }
});
