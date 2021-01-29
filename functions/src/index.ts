export * from './endpoints/auth';
export * from './endpoints/library';
export * from './endpoints/paths';
export * from './endpoints/game';
export * from './endpoints/questions';
export * from './endpoints/dropShit';
export * from './endpoints/checkShit';
export * from './endpoints/glossary';
// @ts-ignore
export * from './mail/welcome';
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

/*export const createActivationCode = functions.https.onRequest(async (request, response) => {
    try {
        const connection = await connect();
        const repo = connection.getRepository(ActivationCodes);

        const newActivationCode = new ActivationCodes();
        newActivationCode.active = true;
        newActivationCode.code = 'ADMIN2020';
        newActivationCode.createdAt = new Date();

        const saved = await repo.save(newActivationCode);

        response.send(saved);
    } catch (e) {
        response.send(e);
    }
});

export const getUsers = functions.https.onRequest(async (request, response) => {
    const connection = await connect();
    const repo = connection.getRepository(Users);

    const all = await repo.find();

    response.send(all);
});

*/