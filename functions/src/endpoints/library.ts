import * as functions from 'firebase-functions';
import {connect, runtimeOpts} from '../config';
import { Library } from '../entities/Library';
import { LibraryWatchingStatus } from '../entities/LibraryWatchingStatus';
// import { Users } from '../entities/Users';
import {vimeoDataExtractor} from "../helpers/parser";
import {applyMiddleware} from "../middleware"


let URL = require('url').URL;

export const getLibrary = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
        const connection = await connect();

        const repoLibrary = connection.getRepository(Library);
        try {
            const all = await repoLibrary.find({
                relations: ["libraryWatchingStatus"]
            });
            // const all = await repoLibrary.createQueryBuilder("library")
            //     .leftJoinAndSelect("library.libraryWatchingStatuses", "photo")
            //     .getMany();

            console.log(all)

            let library = {}
            all.forEach(item => {
                if (item.type in library) {
                    library[item.type].push(item);
                } else {
                    library[item.type] = [item];
                }
            })

            response.send(library);
        } catch (err) {
            console.log(err.message)
            response.send({});
        }
    });
});

export const getWeeklyHandBreakdown = functions.runWith(runtimeOpts).https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
        const connection = await connect();

        const repo = connection.getRepository(Library);
        const all = await repo.findOne({handBreakdown: 1});

        response.send(all);
    });
});

export const uploadLibrary = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () =>{
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

export const watchVideoLibrary = functions.runWith(runtimeOpts).https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () => {
        const libraryId: number = request.body.id;
        const userId: number = request.body.userId;
        console.log(libraryId, userId)
        const connection = await connect();

        const repoLibrary = connection.getRepository(Library);
        // const repoUsers = connection.getRepository(Users);
        const repoLibraryWatchingStatus = connection.getRepository(LibraryWatchingStatus);
        
        try {
            const existing = await repoLibraryWatchingStatus.findOne({
                where: {
                    library: {
                        id: libraryId
                    }
                }
            });
            if (existing) {
                response.send({
                    status: 409,
                    message: "Already existing"
                });
                return;
            }
        } catch (err) {
            console.log(err.message)
            response.send({
                status: 500,
                message: err.message
            });
            return;
        }

        let library;
        try {
            library = await repoLibrary.findOne({
                id: libraryId
            });
        } catch (err) {
            response.send({
                status: 404,
                message: err.message,
            });
            return;
        }

        // let user;
        // try {
        //     user = await repoUsers.findOne({
        //         id: userId
        //     });
        // } catch (err) {
        //     response.send({
        //         status: 404,
        //         message: err.message
        //     });
        //     return;
        // }

        const newLibraryWathcingStatus = new LibraryWatchingStatus();
        newLibraryWathcingStatus.library = library;
        // newLibraryWathcingStatus.user = user;
        try {
            await repoLibraryWatchingStatus.save(newLibraryWathcingStatus)
        } catch (err) {
            response.send({
                status: 500,
                message: err.message
            });
            return;
        }

        response.send({
            status: 201,
            message: ""
        });
    });
})