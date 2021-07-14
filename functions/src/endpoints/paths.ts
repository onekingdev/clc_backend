import * as functions from "firebase-functions";
import { connect } from "../config";
import { Topics } from "../entities/Topics";
import { Lessons } from "../entities/Lessons";
import { Questions } from "../entities/Questions";
import { Users } from "../entities/Users";
import { compareValues } from "../helpers/parser";
const cors = require("cors")({ origin: true });

export const uploadContent = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const connection = await connect();

      const repoTopics = connection.getRepository(Topics);
      const repoLessons = connection.getRepository(Lessons);
      const repoQuestions = connection.getRepository(Questions);

      const { lessons, questions, topics } = request.body;

      await repoTopics.save(topics);
      await repoLessons.save(lessons);
      await repoQuestions.save(questions);

      response.send({ success: 200 });
    });
  }
);

export const getUsersData = async (request) => {
  const { email } = request.body;
  const connection = await connect();
  const repo = connection.getRepository(Users);

  const one = await repo.findOne({ email: email });

  return one;
};

export const getLessonData = async (uid: string, myTopics?: any) => {
  const connection = await connect();
  const repo = connection.getRepository(Lessons);

  const all = await repo.find({ topicUID: uid });
  let current: any;

  let results = all.sort(compareValues("order", "asc"));

  if (myTopics) {
    const topicIndex = myTopics.findIndex((t) => t.UID === uid);
    if (topicIndex !== -1 && myTopics[topicIndex].lessons.length > 0) {
      myTopics[topicIndex].lessons.forEach((lesson, index) => {
        if (lesson.mastered) {
          const masteredIndex = results.findIndex(
            (l: any) => l.UID === lesson.UID
          );
          if (masteredIndex !== -1) {
            results[masteredIndex]["mastered"] = true;
          }
        }
      });
    }
  }

  current = results[0];

  return { total: results.length || 0, current, all: results };
};

//TODO: fix this shit!!!!!
export const getPaths = functions.https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    const { myTopics } = request.body;

    const connection = await connect();
    const repo = connection.getRepository(Topics);
    const user: any = await getUsersData(request);
    const all = await repo.find();

    let available = [],
      locked = [],
      mastered = [];

    if (myTopics.length > 0) {
      for (let i = 0; i < all.length; i++) {
        const lessonData = await getLessonData(all[i].UID, myTopics);

        if (
          myTopics.some(
            (myTopic) => myTopic.UID === all[i].UID && myTopic.mastered
          )
        ) {
          all[i]["status"] = 2;
          all[i]["lessonUID"] = lessonData.current.UID;
          all[i]["lessonName"] = lessonData.current.name
            ? lessonData.current.name
            : lessonData.current.lessonName;
          all[i]["rule"] = lessonData.current.rule;
          all[i]["allTopicLessons"] = lessonData.all;
          all[i]["totalTopicLessons"] = lessonData.total; // TODO: estas variables los puedes meter en un quierybuilder
          all[i]["lessonDescription"] = lessonData.current.description;
          mastered.push(all[i]);
        } else if (
          myTopics.some(
            (myTopic) => myTopic.UID === all[i].UID && !myTopic.mastered
          ) ||
          (all[i].chips === 0 &&
            all[i].tickets === 0 &&
            all[i].masteredLevel <= user.masteredLevel)
        ) {
          all[i]["status"] = 1;
          all[i]["lessonUID"] = lessonData.current.UID;
          all[i]["lessonName"] = lessonData.current.name
            ? lessonData.current.name
            : lessonData.current.lessonName;
          all[i]["rule"] = lessonData.current.rule;
          all[i]["allTopicLessons"] = lessonData.all;
          all[i]["totalTopicLessons"] = lessonData.total;
          all[i]["lessonDescription"] = lessonData.current.description;
          available.push(all[i]);
        } else {
          all[i]["status"] = 0;
          all[i]["lessonName"] = lessonData.current.name
            ? lessonData.current.name
            : lessonData.current.lessonName;
          all[i]["lessonDescription"] = lessonData.current.description;
          locked.push(all[i]);
        }
      }
    } else {
      for (let i = 0; i < all.length; i++) {
        const lessonData = await getLessonData(all[i].UID);

        if (all[i].masteredLevel <= user.masteredLevel) {
          all[i]["status"] = 1;
          all[i]["lessonUID"] = lessonData.current.UID;
          all[i]["lessonName"] = lessonData.current.name;
          all[i]["rule"] = lessonData.current.rule;
          all[i]["allTopicLessons"] = lessonData.all;
          all[i]["totalTopicLessons"] = lessonData.total;
          all[i]["lessonDescription"] = lessonData.current.description;
          available.push(all[i]);
        } else {
          all[i]["status"] = 0;
          all[i]["lessonName"] = lessonData.current.name;
          all[i]["lessonDescription"] = lessonData.current.description;
          locked.push(all[i]);
        }
      }
    }

    response.send({ available, locked, mastered });
  });
});

export const buyTopic = functions.https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    const connection = await connect();
    const repo = connection.getRepository(Users);
    const { UID, id } = request.body;

    let user = await repo.findOne({ id: id });

    const index = user.path.availableTopics.findIndex((t: string) => t === UID);
    if (index !== -1) user.path.availableTopics.splice(index, 1);

    const allLocked = (
      await connection
        .createQueryBuilder(Topics, "topics")
        .select(["topics.UID"])
        .where("topics.UID = :UID")
        .andWhere("topics.masteredLevel <= :masteredLevel")
        .setParameters({ UID: UID })
        .setParameters({ masteredLevel: user.masteredLevel })
        .getRawMany()
    ).map((t) => t.topics_UID);

    if (allLocked.length === 0) {
      response.send({ error: 405 });
    } else {
      allLocked.forEach((lockedUID) => {
        const index = user.path.lockedTopics.findIndex(
          (t: string) => t === lockedUID
        );
        if (index === -1) return;
        user.path.lockedTopics.splice(index, 1);
        user.path.availableTopics.push(lockedUID);
      });

      await repo.save(user);

      response.send(user);
    }
  });
});
