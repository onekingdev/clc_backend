import * as functions from "firebase-functions";
import { app } from "../services/firebase";
import firebase from "firebase";
import { connect } from "../config";
import { Users } from "../entities/Users";
import { ActivationCodes } from "../entities/ActivationCodes";
import { Topics } from "../entities/Topics";
const timestamp = firebase.firestore.FieldValue.serverTimestamp();
const cors = require("cors")({ origin: true });

export const externalRegister = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      let user = request.body; // email, password, displayName

      await app
        .auth()
        .createUserWithEmailAndPassword(user.email, user.password)
        .then(async (result) => {
          // @ts-ignore
          user.stringID = result.user?.uid;

          const connection = await connect();
          const repoUsers = connection.getRepository(Users);
          const repoActivationCodes = connection.getRepository(ActivationCodes);
          const code = await repoActivationCodes.findOne({ code: "FREE2021" });

          const type = () => {
            switch (code.code) {
              case "PREMIUM2021":
                return "premium";
              case "ADMIN2021":
                return "admin";
              case "TESTER2021":
                return "tester";
              case "CLOSER":
                return "closer";
              case "EARLYADOPTER":
                return "free";
              default:
                return "free";
            }
          };

          const allAvailable = (
            await connection
              .createQueryBuilder(Topics, "topics")
              .select(["topics.UID"])
              .where("topics.tickets = 0")
              .andWhere("topics.chips = 0")
              .andWhere("topics.masteredLevel <= 1")
              .getRawMany()
          ).map((t) => t.topics_UID);

          const allLocked = (
            await connection
              .createQueryBuilder(Topics, "topics")
              .select(["topics.UID"])
              .where("topics.masteredLevel > 1")
              .orWhere("topics.tickets > 0")
              .orWhere("topics.chips > 0")
              .getRawMany()
          ).map((t) => t.topics_UID);

          const newUser = new Users();
          newUser.activationCodeID = code.id;
          newUser.assessment = true;
          newUser.avatar = "";
          newUser.userName = user.displayName;
          newUser.email = user.email;
          newUser.type = type();
          newUser.masteredLevel = 1;
          newUser.createdAt = new Date();
          newUser.stringID = user.stringID;
          newUser.payment = {
            id: "",
            created: 0,
            amount: 0,
            subscription: new Date(),
          };
          newUser.path = {
            availableTopics: [...allAvailable],
            lockedTopics: [...allLocked],
            masteredTopics: [],
            masteredLessons: [],
          };

          await repoUsers.save(newUser);

          await app
            .firestore()
            .collection("users")
            .doc(newUser.stringID)
            .set({
              dailyChallenge: {
                questions: 10,
                counter: 0,
                days: [],
                lastUpdate: timestamp,
              },
              chips: 0,
              tickets: 0,
              myTopics: [{}],
              favorites: [],
            });
          await app
            .firestore()
            .collection("earnings")
            .doc(newUser.stringID)
            .set({
              avatar: "S",
              userName: newUser.userName,
              season: { correct: 0, chips: 0, tickets: 0, started: timestamp },
              week: { correct: 0, chips: 0, tickets: 0, started: timestamp },
              month: { correct: 0, chips: 0, tickets: 0, started: timestamp },
              lifetime: { correct: 0, chips: 0, tickets: 0 },
              days: {
                monday: { correct: 0, tickets: 0 },
                tuesday: { correct: 0, tickets: 0 },
                wednesday: { correct: 0, tickets: 0 },
                thursday: { correct: 0, tickets: 0 },
                friday: { correct: 0, tickets: 0 },
                saturday: { correct: 0, tickets: 0 },
                sunday: { correct: 0, tickets: 0 },
              },
              months: {
                december: { correct: 0, tickets: 0 },
                january: { correct: 0, tickets: 0 },
                february: { correct: 0, tickets: 0 },
                march: { correct: 0, tickets: 0 },
                april: { correct: 0, tickets: 0 },
                may: { correct: 0, tickets: 0 },
                june: { correct: 0, tickets: 0 },
                july: { correct: 0, tickets: 0 },
                august: { correct: 0, tickets: 0 },
                september: { correct: 0, tickets: 0 },
                october: { correct: 0, tickets: 0 },
                november: { correct: 0, tickets: 0 },
              },
            });
        })
        .catch((e) => {
          response.send(e);
        });

      response.send(200);
    });
  }
);
