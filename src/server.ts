require('dotenv').config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import log from './log';
import Sequelize from 'sequelize';
import sequelize from './sequelize';
import MapModel, { MapAttr } from './models/Map';

const router = express.Router();
router.use(bodyParser.json());

const app = express();
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const port = process.env.PORT;

router.get('/', (_req, res) => {
  MapModel.findAll().then((maps) => {
    res.json(maps);
  });
});

app.use('/maps', router);

app.listen(port, () => {
  log.info(`server started at port ${port}`);
});

sequelize
  .authenticate()
  .then(() => {
    log.info('Connection has been established successfully.');
  })
  .catch((err: Sequelize.Error) => {
    log.error('Unable to connect to the database:', err);
  });
