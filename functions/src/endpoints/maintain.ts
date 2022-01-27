import * as functions from "firebase-functions";
import { runtimeOpts } from "../config";
import {applyMiddleware} from "../middleware"
const admin = require("firebase-admin");


export const createInitEarningDoc = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
        const {UUID, password, useName} = request.body;
        
        if(!password) {
            response.send({success: false, message: "password is not correct"});
            return
        }
        await admin
            .firestore()
            .collection('earnings')
            .doc(UUID)
            .set({
                avatar: 'S',
                userName: useName,
                season: {correct: 0, chips: 0, tickets: 0, started: new Date()},
                week: {correct: 0, chips: 0, tickets: 0, started: new Date()},
                month: {correct: 0, chips: 0, tickets: 0, started: new Date()},
                lifetime: {correct: 0, chips: 0, tickets: 0},
                days: {
                    monday: {correct: 0, tickets: 0},
                    tuesday: {correct: 0, tickets: 0},
                    wednesday: {correct: 0, tickets: 0},
                    thursday: {correct: 0, tickets: 0},
                    friday: {correct: 0, tickets: 0},
                    saturday: {correct: 0, tickets: 0},
                    sunday: {correct: 0, tickets: 0},
                },
                months: {
                    december: {correct: 0, tickets: 0},
                    january: {correct: 0, tickets: 0},
                    february: {correct: 0, tickets: 0},
                    march: {correct: 0, tickets: 0},
                    april: {correct: 0, tickets: 0},
                    may: {correct: 0, tickets: 0},
                    june: {correct: 0, tickets: 0},
                    july: {correct: 0, tickets: 0},
                    august: {correct: 0, tickets: 0},
                    september: {correct: 0, tickets: 0},
                    october: {correct: 0, tickets: 0},
                    november: {correct: 0, tickets: 0},
                }
            })
            .then((result) => {
                response.send({success: true, result: result});
            })
            .catch((e) => {
                response.send({success: false, message: "Can't create earnings"})
            })
    }, false)
  }
);

export const createInitUserDoc = functions.runWith(runtimeOpts).https.onRequest(
    async (request, response) => {
      applyMiddleware(request, response, async () =>{
          const {UUID, password} = request.body;
          
          if(!password) {
              response.send({success: false, message: "password is not correct"});
              return
          }
          await admin
                .firestore()
                .collection('users')
                .doc(UUID)
                .set({
                    dailyChallenge: {questions: 10, counter: 0, days:[], lastUpdate: new Date()},
                    chips: 0,
                    tickets: 0,
                    myTopics: [{}],
                    favorites: []
                })
              .then((result) => {
                  response.send({success: true, result: result});
              })
              .catch((e) => {
                  response.send({success: false, message: "Can't create earnings"})
              })
      }, false)
    }
  );
