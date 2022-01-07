import * as functions from "firebase-functions";
import { connect, runtimeOpts } from "../config";
import { Users } from "../entities/Users";
import { ActivationCodes } from "../entities/ActivationCodes";
import { Topics } from "../entities/Topics";
import {applyMiddleware} from "../middleware"
const jwt = require('jsonwebtoken');


// export const validateCode = functions.runWith(runtimeOpts).https.onRequest(
//   async (request, response) => {
//     applyMiddleware(request, response, async () =>{
//       const { activationCode } = request.body;

//       const connection = await connect();
//       const repo = connection.getRepository(ActivationCodes);

//       let result: object = await repo.findOne({
//         where: {
//           code: activationCode,
//         },
//       });

//       if (!result) result = { error: 403 };

//       response.send(result);
//     });
//   }
// );
export const validateCode = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
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
    }, false)
  }
);
  
export const getToken = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
      const {id, email} = request.body;
      /*--------------------- Create token -S-----------------------*/
      const token = jwt.sign(
        { user_id: id, email },
        process.env.SECRET_KEY,
        {
          expiresIn: "2h",
        }
      );
      /*--------------------- Create token -E-----------------------*/
      let result = {token: token};
      response.send(result);

    }, false);
  }
);

export const getTokenFunc = (id, email) => {
      /*--------------------- Create token -S-----------------------*/
      const token = jwt.sign(
        { user_id: id, email },
        process.env.SECRET_KEY,
        {
          expiresIn: "2h",
        }
      );
      /*--------------------- Create token -E-----------------------*/
      return token

  }
export const createUser = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
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

        const newUser = new Users();
        newUser.activationCodeID = code.id;
        newUser.assessment = code.isAssessment ? true : false;
        newUser.avatar = "S";
        newUser.userName = userName;
        newUser.email = email;
        newUser.type = type();
        newUser.masteredLevel = 1;
        newUser.createdAt = new Date();
        newUser.lastLoginAt = newUser.createdAt;
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
        const token = saved.id ? getTokenFunc(saved.id, saved.email): "";

        response.send({...saved, token});
      } catch (e) {
        response.send(e);
      }
    }, false);
  }
);

export const getUserByEmail = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
      const { email } = request.body;
      const connection = await connect();
      const repo = connection.getRepository(Users);

      const all = await repo.findOne({ email: email });
      const token = all.id ? getTokenFunc(all.id, all.email): "";
      all.lastLoginAt = new Date();
      response.send({...all, token: token});
      if(!!all.id) repo.save(all);
    }, false);
  }
);

export const getCodes = functions.runWith(runtimeOpts).https.onRequest(async (request, response) => {
  applyMiddleware(request, response, async () =>{
    const connection = await connect();
    const repo = connection.getRepository(ActivationCodes);

    const all = await repo.find();

    response.send(all);
  }, false);
});

export const updateUser = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    applyMiddleware(request, response, async () =>{
      const { id, avatar, email } = request.body;
      const connection = await connect();
      const repo = connection.getRepository(Users);
      const all = await repo.findOne({ id: id });
      all.avatar = avatar;
      all.email = email;
      const saved = await repo.save(all);
      response.send(saved);
    });
  }
);
