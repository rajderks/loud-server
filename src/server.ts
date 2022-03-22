require('dotenv').config();

import express from 'express';
import fs from 'fs';
import path from 'path';
import https from 'https';
import cors from 'cors';
import log from './log';
import Sequelize from 'sequelize';
import sequelize from './sequelize';
import MapRouter from './routes/mapRouter';
import ReleaseRouter from './routes/releaseRouter';
import AuthorizeDeleteMiddleware from './middlewares/authorizeDeleteMiddleware';
import AuthorizePutMiddleware from './middlewares/authorizePutMiddleware';
import { path as rootPath } from 'app-root-path';
import StaticRouter from './routes/staticRouter';

const app = express();

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const port = process.env.PORT;
const port2 = process.env.PORT2;

app.use(AuthorizeDeleteMiddleware);
app.use(AuthorizePutMiddleware);
app.use('/maps', MapRouter);
app.use('/release', ReleaseRouter);
app.use('/static', StaticRouter);

//add some controlled crashing and see if it helps.
//Note: this will not save us from async exceptions happening
//inside expressJS apparently, e.g. with readStream, so
//we have to handle those separately.  Hopefully this
//serves as a catch-all to just kill the process and exit.
//Assuming we have supervisor or some other system process manager
//watching, we can restart the process automatically if it goes down.

//https://blog.heroku.com/best-practices-nodejs-errors
process.on('uncaughtException', err => {
  console.log(`ERROR! Uncaught Exception: ${err.message}`)
    process.exit(1)
    })

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here

});

sequelize
  .authenticate()
  .then(() => {
    log.info('Connection has been established successfully.');
    console.warn('HALLO', process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'production') {
      // Certificate
      const privateKey = fs.readFileSync(
        '/etc/letsencrypt/live/theloudproject.org/privkey.pem',
        'utf8'
      );
      const certificate = fs.readFileSync(
        '/etc/letsencrypt/live/theloudproject.org/cert.pem',
        'utf8'
      );
      const ca = fs.readFileSync(
        '/etc/letsencrypt/live/theloudproject.org/chain.pem',
        'utf8'
      );
      const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca,
      };
      https.createServer(credentials, app).listen(port2, () => {
        log.info(`https server started on port ${port2}`);
      });
    }
    app.listen(port, () => {
      log.info(`server started at port ${port}`);
    });
  })
  .catch((err: Sequelize.Error) => {
    log.error('Unable to connect to the database:', err);
  });
