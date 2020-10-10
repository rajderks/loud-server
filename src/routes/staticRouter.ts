import express from 'express';
import fs from 'fs';
import path from 'path';
import { path as rootPath } from 'app-root-path';
import bodyParser from 'body-parser';
import log from '../log';
import authorizePostMiddleware from '../middlewares/authorizePostMiddleware';

const staticsURI: string = decodeURIComponent(
  path.join(rootPath, 'statics.json')
);
const StaticRouter = express.Router();
StaticRouter.use(bodyParser.text());
StaticRouter.use(bodyParser.json({ type: 'application/json' }));

const whitelistedStatics = <const>['discord', 'downloads'];
type WhitelistedStatics = typeof whitelistedStatics[number];

let persistedStatics: { [K in WhitelistedStatics]?: any };

try {
  fs.stat(staticsURI, (err) => {
    if (err) {
      fs.writeFile(staticsURI, '{}', (errTouch) => {
        log.error(`Could not create file ${staticsURI}:: ${errTouch}`);
      });
      log.verbose(`${staticsURI} created`);
      persistedStatics = {};
      return;
    }
    const content = JSON.parse(
      fs.readFileSync(staticsURI).toString()
    ) as typeof persistedStatics;
    persistedStatics = content;
  });
} catch (e) {
  persistedStatics = {};
  log.error(e);
}

StaticRouter.use(authorizePostMiddleware);

StaticRouter.get('/:key', function (req, res) {
  const key = req.params.key as keyof typeof persistedStatics;

  try {
    if (!key) {
      throw new Error('No key provided');
    }
    let result: any;
    if (key === 'downloads') {
      const downloads = fs.readFileSync(path.join(rootPath, 'downloads.txt'));
      result = downloads;
    } else {
      if (!persistedStatics[key]) {
        throw new Error(`No value for key: ${key}`);
      }
      result = persistedStatics[key];
    }
    res.status(200);
    res.send(result);
    res.end();
  } catch (e) {
    log.error(e);
    res.set('Content-Type', 'text/plain');
    res.status(400).end(e.message);
  }
});

StaticRouter.post('/:key', (req, res) => {
  const key = req.params.key as keyof typeof persistedStatics;
  const body: Partial<typeof persistedStatics> = req.body;
  try {
    if (!key) {
      throw new Error('No key provided');
    }
    if (!whitelistedStatics.includes(key) || key === 'downloads') {
      throw new Error(`Unsupported key: ${key}`);
    }
    const content = JSON.parse(
      fs.readFileSync(staticsURI).toString()
    ) as typeof persistedStatics;
    content[key] = body;
    persistedStatics = content;
    fs.writeFileSync(staticsURI, JSON.stringify(content));
    res.status(200);
    res.send('Jobs done!');
    res.end();
  } catch (e) {
    log.error(e);
    res.set('Content-Type', 'text/plain');
    res.status(400).end(e.message);
  }
});

export default StaticRouter;
