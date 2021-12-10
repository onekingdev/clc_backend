import * as functions from "firebase-functions";
import { connect, runtimeOpts } from "../config";
import { Users } from "../entities/Users";
import { ActivationCodes } from "../entities/ActivationCodes";
import { Topics } from "../entities/Topics";
const cors = require("cors")({ origin: true });

export const validateCode = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const { activationCode } = request.body;

      const connection = await connect();
      const repo = connection.getRepository(ActivationCodes);

      let result: object = await repo.findOne({
        where: {
          code: activationCode,
        },
      });

      if (!result) result = { error: 403 };

      response.send(result);
    });
  }
);

export const createUser = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const { activationCode, email, userName, stringID } = request.body;

      try {
        const connection = await connect();
        const repoUsers = connection.getRepository(Users);
        const repoActivationCodes = connection.getRepository(ActivationCodes);
        const code = await repoActivationCodes.findOne({
          code: activationCode,
        });

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
              return "regular";
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

        console.log('##### code is assessment ######')
        console.log(code.isAssessment)
        console.log('###############################')

        const newUser = new Users();
        newUser.activationCodeID = code.id;
        newUser.assessment = code.isAssessment ? true : false;
        newUser.avatar = "S";
        newUser.userName = userName;
        newUser.email = email;
        newUser.type = type();
        newUser.masteredLevel = 1;
        newUser.createdAt = new Date();
        newUser.stringID = stringID;
        newUser.payment = {
          id: "",
          created: 0,
          amount: 0,
          subscriptionType: "",
          subscription: new Date(),
        };
        newUser.path = {
          availableTopics: allAvailable,
          lockedTopics: allLocked,
          masteredTopics: [],
          masteredLessons: [],
        };

        console.log('##### new user object ######')
        console.table(newUser)
        console.log('############################')

        const saved = await repoUsers.save(newUser);

        console.log('##### saved user in db ######')
        console.table(saved)
        console.log('############################')

        response.send(saved);
      } catch (e) {
        response.send(e);
      }
    });
  }
);

export const getUserByEmail = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
console.log("env : ", process.env.NODE_ENV, process.env.STRIPE_PRODUCTION_KEY,process.env.STRIPE_DEVELOPMENT_KEY);

      const { email } = request.body;
      const connection = await connect();
      const repo = connection.getRepository(Users);

      const all = await repo.findOne({ email: email });

      response.send(all);
    });
  }
);

export const getCodes = functions.runWith(runtimeOpts).https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    const connection = await connect();
    const repo = connection.getRepository(ActivationCodes);

    const all = await repo.find();

    response.send(all);
  });
});

export const updateUser = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      console.log("start update user")
      const { id, avatar, email } = request.body;
      const connection = await connect();
      const repo = connection.getRepository(Users);
      console.log("repo conected")
      const all = await repo.findOne({ id: id });
      console.log(all);
      all.avatar = avatar;
      all.email = email;
      console.log("will save");
      const saved = await repo.save(all);

      response.send(saved);
    });
  }
);
