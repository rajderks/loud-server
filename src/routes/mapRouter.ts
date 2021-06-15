import express from 'express';
import bodyParser from 'body-parser';
import MapSyncRouter from './mapSyncRouter';
import MapModel, { MapAttr } from '../models/Map';
import {
  objectReduceMissingKeys,
  genericAPIError,
  mapPath,
  mapWrite,
  mapDelete,
  mapIdentifierFromFilePath,
} from '../utils';
import sequelize from '../sequelize';
import log from '../log';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { File } from '../types';
import { uuid } from 'uuidv4';
import { path as rootPath } from 'app-root-path';
import { sync as rimrafsync } from 'rimraf';
import { ValidationError } from 'sequelize';

const MapRouter = express.Router();
const upload = multer();

// for parsing application/json
MapRouter.use(bodyParser.json());
// for parsing application/xwww-
MapRouter.use(bodyParser.urlencoded({ extended: true }));

MapRouter.use('/sync', MapSyncRouter);

MapRouter.get('/:token?', async (req, res) => {
  const token = req.params.token;
  if (typeof token === 'string' && !token.includes('-')) {
    return genericAPIError(res, 422, `Invalid token`);
  }
  if (req.params.token) {
    if (req.query.token !== process.env.API_ADMIN_TOKEN) {
      res.sendStatus(403);
      return;
    }
    MapModel.findOne({
      where: {
        token,
      },
    }).then((map) => res.json(map));
  } else {
    MapModel.findAll().then((maps) => {
      res.json(
        maps.map((map) => {
          const { token, ...rest } = map.toJSON() as MapAttr;
          return rest;
        })
      );
    });
  }
});

var dir = path.join(rootPath, 'maps');

var mime = {
  gif: 'image/*',
  scd: 'application/octet-stream',
};

MapRouter.get('/:token/*', function (req, res) {
  try {
    var file = decodeURIComponent(
      path.join(dir, req.path.replace(/\/$/, '/index.html'))
    );
    const token = req.params.token;
    if (file.indexOf(dir + path.sep) !== 0) {
      console.warn('I ERROR HERE 1');
      return res.status(403).end('Forbidden');
    }
    res.download(path.normalize(`maps${path.sep}` + path.relative(dir, file)));
  } catch (err) {
    return genericAPIError(res, 500, err.message);
  }
});

MapRouter.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  async (req, res) => {
    const transaction = await sequelize.transaction({ autocommit: false });
    try {
      // Filter out ineligible uploads
      log.warn(req.body);
      if (req.body?.adminToken !== process.env.API_ADMIN_TOKEN) {
        await transaction.rollback();
        log.error(`Missing: invalid admin token`);
        return genericAPIError(res, 422, `Missing: invalid admin token`);
      }
      if (req.body.mapToken?.length) {
        const modelToOverwrite = await MapModel.findOne({
          where: {
            token: req.body.mapToken,
          },
        });
        if (!modelToOverwrite) {
          await transaction.rollback();
          log.error(`Missing: invalid map token`);
          return genericAPIError(res, 422, `Missing: invalid map token`);
        }
        const token = req.body.mapToken;
        try {
          rimrafsync(mapPath(token));
          const files: { file: File[]; image: File[] } = req.files as any;
          const paths = mapWrite(
            files['file'][0] as File,
            files['image'][0] as File,
            token
          );
          try {
            var insertedMap = await modelToOverwrite.update(
              {
                author: req.body.author,
                name: req.body.name,
                description: req.body.description,
                players: req.body.players,
                size: req.body.size,
                token,
                image: paths.imagePath,
                file: paths.filePath,
                version: req.body.version,
                identifier: mapIdentifierFromFilePath(paths.filePath),
              } as MapAttr,
              { transaction }
            );
            await transaction.commit();
            return res.json(insertedMap);
          } catch (e) {
            log.error('ERROR', e);
            await transaction.rollback();
            return genericAPIError(res, 500, e.message);
          }
        } catch (e) {
          log.error('ERROR', e);
          await transaction.rollback();
          return genericAPIError(res, 500, e.message);
        }
      }
      const token = uuid();
      try {
        const files: { file: File[]; image: File[] } = req.files as any;
        const paths = mapWrite(
          files['file'][0] as File,
          files['image'][0] as File,
          token
        );
        try {
          var insertedMap = await MapModel.create(
            {
              author: req.body.author,
              name: req.body.name,
              description: req.body.description,
              players: req.body.players,
              size: req.body.size,
              token,
              image: paths.imagePath,
              file: paths.filePath,
              version: req.body.version,
              identifier: mapIdentifierFromFilePath(paths.filePath),
            } as MapAttr,
            { transaction }
          );
          await transaction.commit();
          return res.json(insertedMap);
        } catch (e) {
          log.error('ERROR', { message: e.message, errors: e.errors });
          rimrafsync(mapPath(token));
          await transaction.rollback();
          return genericAPIError(res, 400, {
            message: e.message,
            errors: e.errors,
          });
        }
      } catch (e) {
        log.error('ERROR', { message: e.message, errors: e.errors });
        rimrafsync(mapPath(token));
        await transaction.rollback();
        return genericAPIError(res, 400, {
          message: e.message,
          errors: e.errors,
        });
      }
    } catch (e) {
      console.error(e.message);
      log.error('ERROR', e.message);
      await transaction.rollback();
      return genericAPIError(res, 400, {
        message: e.message,
        errors: e.errors,
      });
    }
  }
);

MapRouter.put('/', async (req, res) => {
  const bodyParams: Partial<MapAttr> = req.body;
  const paramsArr: Partial<MapAttr>[] = Array.isArray(bodyParams)
    ? bodyParams
    : [bodyParams];
  const transaction = await sequelize.transaction({ autocommit: false });
  try {
    const missingParams = paramsArr.reduce(
      (acc: string[], params) =>
        acc.concat(objectReduceMissingKeys(params, MapModel.requiredKeys)),
      []
    );

    if (missingParams.length) {
      await transaction.rollback();
      return genericAPIError(
        res,
        422,
        `Missing: ${missingParams.reduce(
          (acc, val) => (acc.length ? `${acc}, ${val}` : val),
          ''
        )}`
      );
    }

    var insertedMaps = await MapModel.bulkCreate(paramsArr, { transaction });
    await transaction.commit();
    return res.json(insertedMaps);
  } catch (e) {
    if (e instanceof ValidationError) {
      console.error(e.message);
      log.error('ERROR', e.message);
      await transaction.rollback();
      return genericAPIError(
        res,
        400,
        JSON.stringify({ message: e.message, errors: e.errors })
      );
    } else {
      console.error(e.message);
      log.error('ERROR', e.message);
      await transaction.rollback();
      return genericAPIError(res, 500, e.message);
    }
  }
});

MapRouter.delete('/:token', async (req, res) => {
  const token = req.params.token;

  const transaction = await sequelize.transaction({ autocommit: false });
  try {
    const modelToDestroy = await MapModel.findOne({
      where: {
        token: token,
      },
    });
    if (!modelToDestroy || modelToDestroy.deletedAt) {
      return genericAPIError(
        res,
        422,
        `Entity with ${token} not found or is already deleted`
      );
    }
    await MapModel.destroy({ where: { token }, transaction });
    mapDelete(token);
    return res.sendStatus(200);
  } catch (e) {
    log.error('ERROR', e.message);
    await transaction.rollback();
    return genericAPIError(res, 500, e.message);
  }
});

export default MapRouter;
