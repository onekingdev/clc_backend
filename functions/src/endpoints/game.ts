import * as functions from "firebase-functions";
import { connect, runtimeOpts } from "../config";
import { Earnings } from "../entities/Earnings";
import { Questions } from "../entities/Questions";
import { parseHandHistory } from "../helpers/parser";
import { Lessons } from "../entities/Lessons";
import { Topics } from "../entities/Topics";
import { Users } from "../entities/Users";
const cors = require("cors")({ origin: true });

export const getQuestions = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const connection = await connect();
      const repoQuestions = connection.getRepository(Questions);
      const { UID } = request.body;

      const all = await repoQuestions.find({ lessonUID: UID });
      const data = [];

      for (let i = 0; i < all.length; i++) {
        data.push({
          ...parseHandHistory(all[i].handHistory),
          question: {
            questionID: all[i].id,
            reward: all[i].reward,
            description: all[i].questionText,
            header: all[i].handNumber,
            questionNumber: i + 1,
            answers: [
              {
                correct: true,
                text: all[i].answers.correct,
                explanation: all[i].explanation.correct,
              },
              {
                correct: false,
                text: all[i].answers.wrong1,
                explanation: all[i].explanation.wrong,
              },
              {
                correct: false,
                text: all[i].answers.wrong2,
                explanation: all[i].explanation.wrong,
              },
              {
                correct: false,
                text: all[i].answers.wrong3,
                explanation: all[i].explanation.wrong,
              },
              all[i].answers.wrong4
                ? {
                    correct: false,
                    text: all[i].answers.wrong4,
                    explanation: all[i].explanation.wrong,
                  }
                : {},
            ],
          },
        });
        // data[i].answers.sort(() => .5 - Math.random());
      }

      response.send(data);
    });
  }
);

export const getTotalLessons = async (topicUID) => {
  const connection = await connect();
  return await connection
    .createQueryBuilder(Lessons, "lessons")
    .addSelect("topics.UID", "topics_UID")
    .addSelect("lessons.UID", "lessons_UID")
    .innerJoin(Topics, "topics", "lessons.topicUID = topics.UID")
    .where("topics.UID = :UID")
    .setParameters({ UID: topicUID })
    .getCount();
};

export const getQuestionsAI = functions.runWith(runtimeOpts).https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const connection = await connect();

      const { user } = request.body;
      const repo = connection.getRepository(Users);
      let thisUser = await repo.findOne({ id: user.id });
      let all;
      // if (thisUser.path.masteredLessons.length > 0) {
        
        // console.log("query is ",query);
      all = await connection
        .createQueryBuilder(Questions, "questions")
        .addSelect("topics.id", "topics_id")
        .addSelect("topics.UID", "topics_UID")
        .addSelect("topics.name", "topics_name")
        .addSelect("topics.chips", "topics_chips")
        .addSelect("topics.tickets", "topics_tickets")
        .addSelect("topics.masteredLevel", "topics_masteredLevel")
        .addSelect("lessons.UID", "lessons_UID")
        .addSelect("lessons.name", "lessons_name")
        .addSelect("lessons.rule", "lessons_rule")
        .addSelect("lessons.description", "lessons_description")
        .addSelect("questions.handNumber", "questions_handNumber")
        .innerJoin(Lessons, "lessons", "questions.lessonUID = lessons.UID")
        .innerJoin(Topics, "topics", "lessons.topicUID = topics.UID")
        .where("topics.UID IN (:...availableTopics)")
        .andWhere("lessons.UID NOT IN (:...masteredLessons)")
        .setParameters({ availableTopics: thisUser.path.availableTopics.length > 0 ? thisUser.path.availableTopics : "" })
        .setParameters({ masteredLessons: thisUser.path.masteredLessons.length > 0 ? thisUser.path.masteredLessons : "" })
        .limit(1000)
        // .getSql();
        .getRawMany();
      if(all.length < 1) {
        if(thisUser.path.availableTopics.length != 0) {
          console.log("if")
          all = await connection
          .createQueryBuilder(Questions, "questions")
          .addSelect("topics.id", "topics_id")
          .addSelect("topics.UID", "topics_UID")
          .addSelect("topics.name", "topics_name")
          .addSelect("topics.chips", "topics_chips")
          .addSelect("topics.tickets", "topics_tickets")
          .addSelect("topics.masteredLevel", "topics_masteredLevel")
          .addSelect("lessons.UID", "lessons_UID")
          .addSelect("lessons.name", "lessons_name")
          .addSelect("lessons.rule", "lessons_rule")
          .addSelect("lessons.description", "lessons_description")
          .addSelect("questions.handNumber", "questions_handNumber")
          .innerJoin(Lessons, "lessons", "questions.lessonUID = lessons.UID")
          .innerJoin(Topics, "topics", "lessons.topicUID = topics.UID")
          .where("topics.UID IN (:...availableTopics)")
          .setParameters({ availableTopics: thisUser.path.availableTopics })
          .limit(1000)
           .getRawMany();
        } else  {
          console.log("else")
          all = await connection
          .createQueryBuilder(Questions, "questions")
          .addSelect("topics.id", "topics_id")
          .addSelect("topics.UID", "topics_UID")
          .addSelect("topics.name", "topics_name")
          .addSelect("topics.chips", "topics_chips")
          .addSelect("topics.tickets", "topics_tickets")
          .addSelect("topics.masteredLevel", "topics_masteredLevel")
          .addSelect("lessons.UID", "lessons_UID")
          .addSelect("lessons.name", "lessons_name")
          .addSelect("lessons.rule", "lessons_rule")
          .addSelect("lessons.description", "lessons_description")
          .addSelect("questions.handNumber", "questions_handNumber")
          .innerJoin(Lessons, "lessons", "questions.lessonUID = lessons.UID")
          .innerJoin(Topics, "topics", "lessons.topicUID = topics.UID")
          .limit(1000)
          .getRawMany();
        }
      }
      // } else {
      //   all = await connection
      //     .createQueryBuilder(Questions, "questions")
      //     .addSelect("topics.id", "topics_id")
      //     .addSelect("topics.UID", "topics_UID")
      //     .addSelect("topics.name", "topics_name")
      //     .addSelect("topics.chips", "topics_chips")
      //     .addSelect("topics.tickets", "topics_tickets")
      //     .addSelect("topics.masteredLevel", "topics_masteredLevel")
      //     .addSelect("lessons.UID", "lessons_UID")
      //     .addSelect("lessons.name", "lessons_name")
      //     .addSelect("lessons.rule", "lessons_rule")
      //     .addSelect("lessons.description", "lessons_description")
      //     .addSelect("questions.handNumber", "questions_handNumber")
      //     .innerJoin(Lessons, "lessons", "questions.lessonUID = lessons.UID")
      //     .innerJoin(Topics, "topics", "lessons.topicUID = topics.UID")
      //     .where("topics.UID IN (:...availableTopics)")
      //     .setParameters({ availableTopics: thisUser.path.availableTopics })
      //     .limit(1000)
      //     .getRawMany();
      // }

      let data = [];

      all.sort(() => 0.5 - Math.random());

      for (let i = 0; i < 20; i++) {
        data.push({
          ...parseHandHistory(all[i]["questions_handHistory"]),
          topicData: {
            id: all[i]["topics_id"],
            UID: all[i]["topics_UID"],
            name: all[i]["topics_name"],
            masteredLevel: all[i]["topics_masteredLevel"],
            chips: all[i]["topics_chips"],
            tickets: all[i]["topics_tickets"],
            status: 1,
            mastered: false,
            lessonUID: all[i]["lessons_UID"],
            lessonName: all[i]["lessons_name"],
            lessonDescription: all[i]["lessons_description"],
            rule: all[i]["lessons_rule"],
            totalTopicLessons: await getTotalLessons(all[i]["topics_UID"]),
          },
          question: {
            questionID: all[i]["questions_id"],
            reward: JSON.parse(all[i]["questions_reward"]),
            description: all[i]["questions_questionText"],
            header: all[i]["questions_handNumber"],
            questionNumber: i + 1,
            answers: [
              {
                correct: true,
                text: JSON.parse(all[i]["questions_answers"]).correct,
                explanation: JSON.parse(all[i]["questions_explanation"])
                  .correct,
              },
              {
                correct: false,
                text: JSON.parse(all[i]["questions_answers"]).wrong1,
                explanation: JSON.parse(all[i]["questions_explanation"]).wrong,
              },
              {
                correct: false,
                text: JSON.parse(all[i]["questions_answers"]).wrong2,
                explanation: JSON.parse(all[i]["questions_explanation"]).wrong,
              },
              {
                correct: false,
                text: JSON.parse(all[i]["questions_answers"]).wrong3,
                explanation: JSON.parse(all[i]["questions_explanation"]).wrong,
              },
              JSON.parse(all[i]["questions_answers"]).wrong4
                ? {
                    correct: false,
                    text: JSON.parse(all[i]["questions_answers"]).wrong4,
                    explanation: JSON.parse(all[i]["questions_explanation"])
                      .wrong,
                  }
                : {},
            ],
          },
        });
      }
      response.send(data);
    });
  }
);


export const getQuestionsAssessment = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const connection = await connect();
      const { myTopics } = request.body;

      const all = await connection
        .createQueryBuilder(Questions, "questions")
        .addSelect("topics.id", "topics_id")
        .addSelect("topics.UID", "topics_UID")
        .addSelect("topics.name", "topics_name")
        .addSelect("topics.chips", "topics_chips")
        .addSelect("topics.tickets", "topics_tickets")
        .addSelect("topics.masteredLevel", "topics_masteredLevel")
        .addSelect("lessons.UID", "lessons_UID")
        .addSelect("lessons.name", "lessons_name")
        .addSelect("lessons.rule", "lessons_rule")
        .addSelect("lessons.description", "lessons_description")
        .addSelect("questions.handNumber", "questions_handNumber")
        .innerJoin(Lessons, "lessons", "questions.lessonUID = lessons.UID")
        .innerJoin(Topics, "topics", "lessons.topicUID = topics.UID")
        .where("questions.assessment = 1")
        .getRawMany();

      let filteredQuestions = all;
      const data = [];

      myTopics.forEach((topic) => {
        if (topic.lessons) {
          topic.lessons.forEach((lesson) => {
            lesson.questions.forEach((question) => {
              all.forEach((q, index) => {
                if (question.id === q["questions_id"]) {
                  filteredQuestions.splice(index, 1);
                }
              });
            });
          });
        }
      });

      for (let i = 0; i < filteredQuestions.length; i++) {
        data.push({
          ...parseHandHistory(filteredQuestions[i]["questions_handHistory"]),
          topicData: {
            id: parseInt(filteredQuestions[i]["topics_id"]),
            UID: filteredQuestions[i]["topics_UID"],
            name: filteredQuestions[i]["topics_name"],
            masteredLevel: filteredQuestions[i]["topics_masteredLevel"],
            chips: parseInt(filteredQuestions[i]["topics_chips"]),
            tickets: parseInt(filteredQuestions[i]["topics_tickets"]),
            status: 1,
            mastered: false,
            lessonUID: filteredQuestions[i]["lessons_UID"],
            lessonName: filteredQuestions[i]["lessons_name"],
            lessonDescription: filteredQuestions[i]["lessons_description"],
            rule: all[i]["lessons_rule"],
            totalTopicLessons: 0,
          },
          question: {
            questionID: parseInt(filteredQuestions[i]["questions_id"]),
            reward: JSON.parse(filteredQuestions[i]["questions_reward"]),
            description: filteredQuestions[i]["questions_questionText"],
            header: all[i]["questions_handNumber"],
            questionNumber: i + 1,
            answers: [
              {
                correct: true,
                text: JSON.parse(filteredQuestions[i]["questions_answers"])
                  .correct,
                explanation: JSON.parse(
                  filteredQuestions[i]["questions_explanation"]
                ).correct,
              },
              {
                correct: false,
                text: JSON.parse(filteredQuestions[i]["questions_answers"])
                  .wrong1,
                explanation: JSON.parse(
                  filteredQuestions[i]["questions_explanation"]
                ).wrong,
              },
              {
                correct: false,
                text: JSON.parse(filteredQuestions[i]["questions_answers"])
                  .wrong2,
                explanation: JSON.parse(
                  filteredQuestions[i]["questions_explanation"]
                ).wrong,
              },
              {
                correct: false,
                text: JSON.parse(filteredQuestions[i]["questions_answers"])
                  .wrong3,
                explanation: JSON.parse(
                  filteredQuestions[i]["questions_explanation"]
                ).wrong,
              },
              JSON.parse(filteredQuestions[i]["questions_answers"]).wrong4
                ? {
                    correct: false,
                    text: JSON.parse(filteredQuestions[i]["questions_answers"])
                      .wrong4,
                    explanation: JSON.parse(
                      filteredQuestions[i]["questions_explanation"]
                    ).wrong,
                  }
                : {},
            ],
          },
        });
        // data[i].answers.sort(() => .5 - Math.random());
      }

      response.send(data);
    });
  }
);

export const getAnswers = async (questionID, userID) => {
  const connection = await connect();
  let answers = await connection
    .createQueryBuilder(Earnings, "earnings")
    .where("earnings.questionID = :questionID")
    .andWhere("earnings.userID = :userID")
    .setParameters({ questionID: questionID })
    .setParameters({ userID: userID })
    .getRawMany();

  if (!answers[answers.length - 1]) return null;
  else if (answers[answers.length - 1]["earnings_correct"] == 1) return true;

  return false;
};

export const getQuestionsProgressbar = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const connection = await connect();
      const { type, UID, user, today } = request.body;

      let all,
        progressIndex = 0,
        ticketsEarned = 0,
        chipsEarned = 0,
        correctQuestions = 0,
        progressData = [];

      switch (type) {
        case "assessment":
          all = await connection
            .createQueryBuilder(Questions, "questions")
            .addSelect("topics.id", "topics_id")
            .addSelect("topics.UID", "topics_UID")
            .addSelect("topics.name", "topics_name")
            .addSelect("topics.chips", "topics_chips")
            .addSelect("topics.tickets", "topics_tickets")
            .addSelect("topics.masteredLevel", "topics_masteredLevel")
            .addSelect("lessons.UID", "lessons_UID")
            .addSelect("lessons.name", "lessons_name")
            .addSelect("lessons.rule", "lessons_rule")
            .addSelect("questions.handNumber", "questions_handNumber")
            .innerJoin(Lessons, "lessons", "questions.lessonUID = lessons.UID")
            .innerJoin(Topics, "topics", "lessons.topicUID = topics.UID")
            .where("questions.assessment = 1")
            .getRawMany();
          break;

        case "game":
          all = await connection
            .createQueryBuilder(Questions, "questions")
            .addSelect("topics.id", "topics_id")
            .addSelect("topics.UID", "topics_UID")
            .addSelect("topics.name", "topics_name")
            .addSelect("topics.chips", "topics_chips")
            .addSelect("topics.tickets", "topics_tickets")
            .addSelect("topics.masteredLevel", "topics_masteredLevel")
            .addSelect("lessons.UID", "lessons_UID")
            .addSelect("lessons.name", "lessons_name")
            .addSelect("lessons.rule", "lessons_rule")
            .addSelect("questions.handNumber", "questions_handNumber")
            .innerJoin(Lessons, "lessons", "questions.lessonUID = lessons.UID")
            .innerJoin(Topics, "topics", "lessons.topicUID = topics.UID")
            .where("lessons.UID = :lessonUID")
            .setParameters({ lessonUID: UID })
            .getRawMany();
          break;

        case "ai":
          all = await connection
            .createQueryBuilder(Earnings, "earnings")
            .addSelect("topics.id", "topics_id")
            .addSelect("topics.UID", "topics_UID")
            .addSelect("topics.name", "topics_name")
            .addSelect("topics.chips", "topics_chips")
            .addSelect("topics.tickets", "topics_tickets")
            .addSelect("topics.masteredLevel", "topics_masteredLevel")
            .addSelect("lessons.UID", "lessons_UID")
            .addSelect("lessons.name", "lessons_name")
            .addSelect("lessons.rule", "lessons_rule")
            .addSelect("questions.id", "questions_id")
            .innerJoin(
              Questions,
              "questions",
              "earnings.questionID = questions.id"
            )
            .innerJoin(Lessons, "lessons", "questions.lessonUID = lessons.UID")
            .innerJoin(Topics, "topics", "lessons.topicUID = topics.UID")
            .where("earnings.challenge = 1")
            .andWhere("earnings.createdAt >= CURDATE()")
            .andWhere("earnings.userID = :userID")
            .setParameters({ userID: user.id })
            //.setParameters({ date: today})
            .orderBy("earnings.createdAt", "ASC")
            .getRawMany();
          console.log(today);
          break;
      }
      if (type === "ai") {
        for (let i = 0; i < user.dailyQuestions; i++) {
          if (all[i]) {
            progressData.push({
              id: all[i]["questions_id"],
              correct: await getAnswers(all[i]["questions_id"], user.id),
            });
            if (progressData[i].correct !== null) progressIndex += 1;
            if (progressData[i].correct) correctQuestions += 1;
          } else {
            progressData.push({
              id: 0,
              correct: null,
            });
          }
        }
      } else {
        for (let i = 0; i < all.length; i++) {
          progressData.push({
            id: all[i]["questions_id"],
            correct: await getAnswers(all[i]["questions_id"], user.id),
          });
          if (progressData[i].correct !== null) progressIndex += 1;
          if (progressData[i].correct) correctQuestions += 1;
        }
      }

      response.send({
        progressIndex,
        ticketsEarned,
        chipsEarned,
        correctQuestions,
        totalQuestions: progressData.length,
        progressData,
      });
    });
  }
);

export const saveEarnings = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const connection = await connect();
      const repoEarnings = connection.getRepository(Earnings);

      const { userID, questionID, tickets, chips, challenge, correct } =
        request.body;

      await repoEarnings.save({
        userID,
        questionID,
        tickets,
        chips,
        challenge,
        correct,
      });

      response.send(200);
    });
  }
);

export const levelUp = functions.https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    const connection = await connect();
    const repo = connection.getRepository(Users);

    const { id, UID } = request.body;

    let user = await repo.findOne({ id: id });

    user.masteredLevel += 1;
    const index = user.path.availableTopics.findIndex((t: string) => t === UID);
    if (index !== -1) user.path.availableTopics.splice(index, 1);
    user.path.masteredTopics.push(UID);

    const allLocked = (
      await connection
        .createQueryBuilder(Topics, "topics")
        .select(["topics.UID"])
        .where("topics.masteredLevel = :masteredLevel")
        .andWhere("topics.tickets = 0")
        .andWhere("topics.chips = 0")
        .setParameters({ masteredLevel: user.masteredLevel })
        .getRawMany()
    ).map((t) => t.topics_UID);

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
  });
});

export const finishAssessment = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const connection = await connect();
      const repo = connection.getRepository(Users);

      const { id } = request.body;

      let user = await repo.findOne({ id: id });

      user.assessment = false;

      await repo.save(user);

      response.send(user);
    });
  }
);

export const updateMasteredLessons = functions.https.onRequest(
  async (request, response) => {
    cors(request, response, async () => {
      const connection = await connect();
      const repo = connection.getRepository(Users);

      const { id, UID } = request.body;

      let user = await repo.findOne({ id: id });

      user.path.masteredLessons.push(UID);

      await repo.save(user);

      response.send();
    });
  }
);
