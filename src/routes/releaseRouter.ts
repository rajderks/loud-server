import { path as rootPath } from 'app-root-path';
import express from 'express';
import fs from 'fs';
import path from 'path';
import log from '../log';

const ReleaseRouter = express.Router();

ReleaseRouter.get('/', function (_req, res) {
  var file = decodeURIComponent(path.join(rootPath, 'SCFA_Updater.exe'));
  var type = 'application/octet-stream';
  try {
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
  } catch (e) {
    log.error(e);
    res.set('Content-Type', 'text/plain');
    res.status(404).end('Not found');
  }
});

export default ReleaseRouter;
