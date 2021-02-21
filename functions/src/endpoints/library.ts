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

export const getWeeklyHandBreakdown = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        const repo = connection.getRepository(Library);
        const all = await repo.findOne({handBreakdown: 1});

        response.send(all);
    });
});

export const uploadLibrary = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const connection = await connect();

        const repoLibrary = connection.getRepository(Library);

        const {library} = request.body;

        for (let i = 0; i <= library.length -1; i++) {
            let data = {image: '', description: '', duration: '', title: ''};
            if (new URL(library[i].url).host === 'vimeo.com' || new URL(library[i].url).host === 'player.vimeo.com') {
                data = await vimeoDataExtractor(library[i].url);
            } else {
                data['description'] = library[i].description;
                data['image'] = library[i].image;
                data['duration'] = library[i].duration;
                data['title'] = library[i].title;
            }
            if (data !== null) {
                await repoLibrary.save({
                    ...library[i],
                    title: data.title,
                    image: data.image,
                    description: data.description,
                    duration: data.duration,
                    createdAt: new Date()
                });
            }
        }

        response.send({success: 200})
    });
});