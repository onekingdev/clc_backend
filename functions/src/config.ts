import {ConnectionOptions, Connection, createConnection, getConnection} from "typeorm";
import 'reflect-metadata';
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";

export const prod = process.env.NODE_ENV === 'production';
// export const stripe_env = 'production';
export const stripe_env = process.env.NODE_ENV;
export let config: ConnectionOptions = (() => {
    switch (process.env.NODE_ENV) {
        case 'local':
            return {
                name: 'clc',
                type: 'mysql',
                host: 'localhost',
                port: 3306,
                username: 'root',
                password: '',
                database: 'clc',
                synchronize: true,
                logging: false,
                entities: [
                    'lib/entities/*.js'
                ],
            };
        case 'production':
            return {
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
                extra: {
                    socketPath: '/cloudsql/chipleadercoaching-webapp:us-central1:clc'
                }
            };
        case 'development':
        default:
            return {
                name: 'clc',
                type: 'mysql',
                host: '34.66.49.142',
                port: 3306,
                username: 'devs',
                password: 'devs1234',
                database: 'clc',
                synchronize: true,
                logging: false,
                entities: [
                    'lib/entities/*.js'
                ],
                extra: {
                    socketPath: '/cloudsql/devenvclc:us-central1:clc-dev'
                }
            };
    }
})() as MysqlConnectionOptions;

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