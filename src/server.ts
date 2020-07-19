require('dotenv').config();

import express from 'express';
import cors from 'cors';
import log from './log';
import Sequelize from 'sequelize';
import sequelize from './sequelize';
import MapRouter from './routes/mapRouter';
import AuthorizeDeleteMiddleware from './middlewares/authorizeDeleteMiddleware';
import path from 'path';
import fs from 'fs';
import { path as rootPath } from 'app-root-path';

const app = express();

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

const port = process.env.PORT;

app.use(AuthorizeDeleteMiddleware);
app.use('/maps', MapRouter);

var dir = path.join(rootPath, 'public');

var mime = {
  gif: 'image/*',
  scd: 'application/octet-stream',
};

app.get('*', function (req, res) {
  var file = decodeURIComponent(
    path.join(dir, req.path.replace(/\/$/, '/index.html'))
  );
  console.warn('TRYING FILE', file);
  if (file.indexOf(dir + path.sep) !== 0) {
    return res.status(403).end('Forbidden');
  }
  //@ts-ignore
  var type = mime[path.extname(file).slice(1)] || 'text/plain';
  var s = fs.createReadStream(file);
  s.on('open', function () {
    res.set('Content-Type', type);
    s.pipe(res);
  });
  s.on('error', function (e) {
    log.error(e);
    res.set('Content-Type', 'text/plain');
    res.status(404).end('Not found');
  });
});

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
