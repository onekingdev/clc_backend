import {ConnectionOptions, Connection, createConnection, getConnection} from "typeorm";
import 'reflect-metadata';

export const prod = process.env.NODE_ENV === 'production';

export const config: ConnectionOptions = {
    name: 'clc',
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    username: 'root',
    password: 'armandoTodoPoderoso',
    database: 'clc',
    synchronize: true,
    logging: false,
    entities: [
        'lib/entities/*.js'
    ],

    // Production Mode
    ...(prod && {
        database: 'production',
        logging: false,
        // synchronize: false,
        extra: {
            socketPath: '/cloudsql/clc-poker:us-central1:clc-poker'
        }
    })
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