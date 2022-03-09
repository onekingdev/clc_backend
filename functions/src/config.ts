import {ConnectionOptions, Connection, createConnection, getConnection} from "typeorm";
import 'reflect-metadata';

export const prod = process.env.NODE_ENV === 'production';
// export const stripe_env = 'production';
export const stripe_env = process.env.NODE_ENV;
export let config: ConnectionOptions;


/*-------------------- Dev database -S-----------------------*/
if(process.env.GCLOUD_PROJECT == "devenvclc") {
    config = process.env.NODE_ENV==="production" ? 
        {
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

            // Dev Mode
            ...(prod && {
                database: 'clc',
                logging: false,
                // synchronize: false,
                extra: {
                    socketPath: '/cloudsql/devenvclc:us-central1:clc-dev'
                }
            }),
        }

        :{
            name: 'clc',
            type: 'mysql',
            host:'localhost',
            port: 3306,
            username: 'root',
            password: '',
            database: 'clc',
            synchronize: true,
            logging: false,
            entities: [
                'lib/entities/*.js'
            ],

            // Dev Mode
            ...(prod && {
                database: 'clc',
                logging: false,
                // synchronize: false,
                extra: {
                    socketPath: '/cloudsql/devenvclc:us-central1:clc-dev'
                }
            }),
        }
}
/*-------------------- Dev database -E-----------------------*/

/*-------------------- Production database -S-----------------------*/
else {
    config = {
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
        // ...(prod && {
        //     database: 'clc',
        //     logging: false,
        //     // synchronize: false,
        //     extra: {
        //         socketPath: '/cloudsql/chipleadercoaching-webapp:us-central1:clc'
        //     }
        // }),
    }
}
/*-------------------- Production database -E-----------------------*/


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