import * as functions from 'firebase-functions';
import {connect} from '../config';
import { Library } from '../entities/Library';
import {vimeoDataExtractor} from "../helpers/parser";
const cors = require('cors')({origin: true});

let URL = require('url').URL;

export const getLibrary = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        const repoLibrary = connection.getRepository(Library);
        const all = await repoLibrary.find();

        let library = {}
        all.forEach(item => {
            if (item.type in library) {
                library[item.type].push(item);
            } else {
                library[item.type] = [item];
            }
        })

        response.send(library);
    });
});

export const uploadLibrary = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        const repoLibrary = connection.getRepository(Library);

        const {library} = request.body;


        (library as Array<Object> || []).forEach(async (value: any) => {
            let data = {image: '', description: '', duration: '', title: ''};
            if (new URL(value.url).host === 'vimeo.com' || new URL(value.url).host === 'player.vimeo.com') data = await vimeoDataExtractor(value.url);
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
});