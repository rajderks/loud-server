require('dotenv').config();

import express from 'express';
import cors from 'cors';
import log from './log';
import Sequelize from 'sequelize';
import sequelize from './sequelize';
import MapRouter from './routes/mapRouter';
import ReleaseRouter from './routes/releaseRouter';
import AuthorizeDeleteMiddleware from './middlewares/authorizeDeleteMiddleware';

const app = express();

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const port = process.env.PORT;

app.use(AuthorizeDeleteMiddleware);
app.use('/maps', MapRouter);
app.use('/release', ReleaseRouter);

sequelize
  .authenticate()
  .then(() => {
    log.info('Connection has been established successfully.');

    app.listen(port, () => {
      log.info(`server started at port ${port}`);
    });
  })
  .catch((err: Sequelize.Error) => {
    log.error('Unable to connect to the database:', err);
  });
