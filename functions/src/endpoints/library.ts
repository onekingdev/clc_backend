import * as functions from 'firebase-functions';
import {connect} from '../config';
import { Library } from '../entities/Library';
import {vimeoDataExtractor} from "../helpers/parser";

let URL = require('url').URL;

export const getLibrary = functions.https.onRequest(async (request, response) => {
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

    const {library} = request.body;


    (library as Array<Object> || []).forEach(async (value: any) => {
        let data = {image: '', description: '', duration: '', title: ''};
        if (new URL(value.url).host === 'vimeo.com') data = await vimeoDataExtractor(value.url);
        else {
            data['description'] = value.description;
            data['image'] = value.image;
            data['duration'] = value.duration;
            data['title'] = value.title;
        }
        await repoLibrary.save({
            ...value,
            title: data.title,
            image: data.image,
            description: data.description,
            duration: data.duration,
            createdAt: new Date()
        });
    });

    response.send({success: 200})
});