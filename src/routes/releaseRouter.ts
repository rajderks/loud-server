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
    s.on('close', function () {
      fs.stat('./downloads.txt', (fsErr) => {
        if (fsErr) {
          fs.writeFile('./downloads.txt', 1, (err) => {
            if (err) {
              log.warn("Can't write file " + err);
              return;
            }
          });
        } else {
          fs.readFile('./downloads.txt', (errRead, data) => {
            if (errRead) {
              log.warn("Can't read downloads " + errRead);
              return;
            }
            try {
              const downloads = Number.parseInt(data.toString());
              fs.writeFileSync('./downloads.txt', downloads + 1);
            } catch (err) {
              log.warn("Can't read downloads " + err);
            }
          });
        }
      });
    });
  } catch (e) {
    log.error(e);
    res.set('Content-Type', 'text/plain');
    res.status(404).end('Not found');
  }
});

export default ReleaseRouter;
