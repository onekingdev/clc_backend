import {ConnectionOptions, Connection, createConnection, getConnection} from "typeorm";
import 'reflect-metadata';

export const prod = process.env.NODE_ENV === 'production';
// export const stripe_env = 'production';
export const stripe_env = process.env.NODE_ENV;


/*-------------------- Production database -S-----------------------*
export const config: ConnectionOptions = {
    name: 'clc',
    type: 'mysql',
    host:'35.238.13.230',
    port: 3306,
    username: 'clcdevelopers',
    password: 'Socrat3s!123',
    database: 'clc',
    synchronize: true,
    logging: false,
    entities: [
        'lib/entities/*.js'
    ],

    // Production Mode
    ...(prod && {
        database: 'clc',
        logging: false,
        // synchronize: false,
        extra: {
            socketPath: '/cloudsql/chipleadercoaching-webapp:us-central1:clc'
        }
    }),
}
/*-------------------- Production database -E-----------------------*/

/*-------------------- Dev database -S-----------------------*/
export const config: ConnectionOptions = {
    name: 'clc',
    type: 'mysql',
    host:'34.66.49.142',
    port: 3306,
    username: 'devs',
    password: 'devs1234',
    database: 'clc',
    synchronize: true,
    logging: false,
    entities: [
        'lib/entities/*.js'
    ],

    // Production Mode
    ...(prod && {
        database: 'clc',
        logging: false,
        // synchronize: false,
        extra: {
            socketPath: '/cloudsql/devenvclc:us-central1:clc-dev'
        }
    }),
}
/*-------------------- Dev database -E-----------------------*/

export const connect = async () => {
    let connection: Connection;

    try {
        connection = getConnection(config.name)
    } catch (e) {
        connection = await createConnection(config);
    }
    return connection;
}

export const runtimeOpts = {
    timeoutSeconds: 540
}