import express from 'express';
import bodyParser from 'body-parser';
import MapModel, { MapAttr } from '../models/Map';
import { objectReduceMissingKeys, genericAPIError } from '../utils';
import sequelize from '../sequelize';
import log from '../log';

const MapRouter = express.Router();

MapRouter.use(bodyParser.json());

MapRouter.get('/', (_req, res) => {
  MapModel.findAll().then((maps) => {
    res.json(maps);
  });
});

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
    return next();
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
