import * as functions from 'firebase-functions';
import {connect, runtimeOpts} from '../config';
import { Library } from '../entities/Library';
import { LibraryWatchingStatus } from '../entities/LibraryWatchingStatus';
// import { Users } from '../entities/Users';
import {vimeoDataExtractor} from "../helpers/parser";
import {applyMiddleware} from "../middleware"


let URL = require('url').URL;

export const getLibrary = functions.https.onRequest(async (request, response) => {
    applyMiddleware(request, response, async () => {
        const { sortByNewest, sortByWatch, userId } = request.query;
        console.log(userId)
        if (typeof sortByNewest === "object") {
            return
        }
        if (typeof sortByWatch === "object") {
            return
        }
        if (typeof userId === "object") {
            return
        }
        let userIdNum
        try {
            userIdNum = parseInt(userId, 10)
        } catch (err) {
            return
        }
        const connection = await connect();
        const repoLibrary = connection.getRepository(Library);
        const repoLibraryWatchingStatus = connection.getRepository(LibraryWatchingStatus);
        try {
            const all = await repoLibrary.find({
                order: {
                    type: "ASC",
                    createdAt: sortByNewest === "Newest" ? "DESC" : "ASC"
                }
            })
            const watchingStatuses = await repoLibraryWatchingStatus.find()
            
            // const all = await repoLibrary.find({
            //     // relations: ["libraryWatchingStatus"]
            // });

            let library = {}
            all.forEach(item => {
                const libraryWatchingStatus = watchingStatuses.filter((watchingStatus) => watchingStatus.libraryId === item.id && userIdNum === watchingStatus.userId).length > 0
                if (sortByWatch === "Watched") {
                    if (libraryWatchingStatus) {
                        if (item.type in library) {
                            library[item.type].push({
                                ...item,
                                libraryWatchingStatus
                            });
                        } else {
                            library[item.type] = [{
                                ...item,
                                libraryWatchingStatus
                            }];
                        }
                    }
                } else if (sortByWatch === "Unwatched") {
                    if (!libraryWatchingStatus) {
                        if (item.type in library) {
                            library[item.type].push({
                                ...item,
                                libraryWatchingStatus
                            });
                        } else {
                            library[item.type] = [{
                                ...item,
                                libraryWatchingStatus
                            }];
                        }
                    }
                } else {
                    if (item.type in library) {
                        library[item.type].push({
                            ...item,
                            libraryWatchingStatus
                        });
                    } else {
                        library[item.type] = [{
                            ...item,
                            libraryWatchingStatus
                        }];
                    }
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
        const watched: boolean = request.body.watched;
        const connection = await connect();

        const repoLibraryWatchingStatus = connection.getRepository(LibraryWatchingStatus);
        
        try {
            const existing = await repoLibraryWatchingStatus.findOne({
                where: {
                    libraryId: libraryId,
                    userId: userId,
                }
            });
            if (existing) {
                if (watched) {
                    response.send({
                        status: 409,
                        message: "Already existing"
                    });
                    return;
                } else {
                    try {
                        const removed = await repoLibraryWatchingStatus.delete({
                            id: existing.id
                        })
                        if (removed.affected) {
                            response.send({
                                status: 200,
                                message: ""
                            })
                        } else {
                            response.send({
                                status: 500,
                                message: "Failed to remove"
                            })
                        }
                        return;
                    } catch (err) {
                        response.send({
                            status: 500,
                            message: err.message
                        })
                        return;
                    }
                }
            }
        } catch (err) {
            console.log(err.message)
            response.send({
                status: 500,
                message: err.message
            });
            return;
        }

        const newLibraryWathcingStatus = new LibraryWatchingStatus();
        newLibraryWathcingStatus.libraryId = libraryId;
        newLibraryWathcingStatus.userId = userId;
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