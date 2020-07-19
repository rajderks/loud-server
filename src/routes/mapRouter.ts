import express from 'express';
import bodyParser from 'body-parser';
import MapModel, { MapAttr } from '../models/Map';
import {
  objectReduceMissingKeys,
  genericAPIError,
  mapPath,
  mapWrite,
} from '../utils';
import sequelize from '../sequelize';
import log from '../log';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { File } from '../types';
import { uuid } from 'uuidv4';
import { path as rootPath } from 'app-root-path';
import { title } from 'process';

const MapRouter = express.Router();
const upload = multer();

// for parsing application/json
MapRouter.use(bodyParser.json());
// for parsing application/xwww-
MapRouter.use(bodyParser.urlencoded({ extended: true }));

MapRouter.get('/', (_req, res) => {
  MapModel.findAll().then((maps) => {
    res.json(
      maps.map((map) => {
        const { token, ...rest } = map.toJSON() as MapAttr;
        return rest;
      })
    );
  });
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
      // @ts-ignore
      // console.warn('image found', req.files['image'][0]);
      // // @ts-ignore
      // console.warn('file found', req.files['file'][0]);
      // console.warn('body found', JSON.stringify(req.body, null, 2));
      // Filter out ineligible uploads
      if (
        (req.body.official === 'true' && !req.body?.adminToken?.length) ||
        (req.body.official === 'true' &&
          req.body.adminToken !== process.env.API_ADMIN_TOKEN)
      ) {
        await transaction.rollback();
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
          return genericAPIError(res, 422, `Missing: invalid map token`);
        }
        // @ToDo: stuffzsdser
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
            } as MapAttr,
            { transaction }
          );
          await transaction.commit();
          return res.json(insertedMap);
        } catch (e) {
          log.error('ERROR', e);
          fs.rmdirSync(mapPath(token), { recursive: true });
          await transaction.rollback();
          return genericAPIError(res, 500, e.message);
        }
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
);

MapRouter.put('/', async (req, res, next) => {
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
    log.error('ERROR', e);
    await transaction.rollback();
    return genericAPIError(res, 500, e.message);
  }
});

MapRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;

  if (typeof id !== 'string') {
    return genericAPIError(res, 422, `Missing id`);
  }
  const modelToDestroy = await MapModel.findByPk(id);
  if (!modelToDestroy || modelToDestroy.deletedAt) {
    return genericAPIError(
      res,
      422,
      `Entity with ${id} not found or is already deleted`
    );
  }
  await MapModel.destroy({ where: { id } });
  return res.sendStatus(200);
});

export default MapRouter;
