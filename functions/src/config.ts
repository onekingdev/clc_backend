import {ConnectionOptions, Connection, createConnection, getConnection} from "typeorm";
import 'reflect-metadata';

export const prod = process.env.NODE_ENV === 'production';
export const stripe_env = 'production';

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

export const connect = async () => {
    let connection: Connection;

    try {
        connection = getConnection(config.name)
    } catch (e) {
        connection = await createConnection(config);
    }
    return connection;
}