import express from 'express';
import bodyParser from 'body-parser';
import MapModel, { MapAttr } from '../models/Map';
import { objectReduceMissingKeys, genericAPIError } from '../utils';

const MapRouter = express.Router();

MapRouter.use(bodyParser.json());

MapRouter.get('/', (_req, res) => {
  MapModel.findAll().then((maps) => {
    res.json(maps);
  });
});

MapRouter.put('/', async (req, res) => {
  const params: Partial<MapAttr> = req.body;
  const missingParams = objectReduceMissingKeys(params, MapModel.requiredKeys);
  if (missingParams.length) {
    return genericAPIError(
      res,
      422,
      `Missing: ${missingParams.reduce(
        (acc, val) => (acc.length ? `${acc}, ${val}` : val),
        ''
      )}`
    );
  }
  var insertedMap = await MapModel.create(params);
  res.json(insertedMap);
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
