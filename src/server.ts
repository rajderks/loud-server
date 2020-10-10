require('dotenv').config();

import express from 'express';
import fs from 'fs';
import https from 'https';
import cors from 'cors';
import log from './log';
import Sequelize from 'sequelize';
import sequelize from './sequelize';
import MapRouter from './routes/mapRouter';
import ReleaseRouter from './routes/releaseRouter';
import AuthorizeDeleteMiddleware from './middlewares/authorizeDeleteMiddleware';
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
app.use('/maps', MapRouter);
app.use('/release', ReleaseRouter);
app.use('/static', StaticRouter);

sequelize
  .authenticate()
  .then(() => {
    log.info('Connection has been established successfully.');
    console.warn('HALLO', process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'production') {
      // Certificate
      const privateKey = fs.readFileSync(
        `${rootPath}/certs/privkey1.pem`,
        'utf8'
      );
      const certificate = fs.readFileSync(
        `${rootPath}/certs/cert1.pem`,
        'utf8'
      );
      const ca = fs.readFileSync(`${rootPath}/certs/chain1.pem`, 'utf8');
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
