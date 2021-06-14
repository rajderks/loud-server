import express from 'express';
import bodyParser from 'body-parser';
import MapModel, { MapAttr } from '../models/Map';
import { Op } from 'sequelize';
import { genericAPIError } from '../utils';

const MapSyncRouter = express.Router();

// for parsing application/json
MapSyncRouter.use(bodyParser.json());

MapSyncRouter.post('/', async (req, res) => {
  const bodyParams: Partial<MapAttr>[] = req.body;
  if (!Array.isArray(bodyParams)) {
    return genericAPIError(
      res,
      400,
      `Params is not of type Array ${typeof bodyParams}`
    );
  }
  const mapNames = bodyParams
    .map((m) => (m.identifier?.length ? m.identifier : null))
    .filter((m) => !!m);
  const mapsAndVersions = await MapModel.findAll({
    attributes: ['identifier', 'version'],
    where: {
      identifier: {
        [Op.in]: mapNames,
      },
    },
  });
  const mapsAndVersionsJSON: {
    identifier: string;
    version: string;
  }[] = mapsAndVersions.map(
    (model) => model.toJSON() as { identifier: string; version: string }
  );
  if (!Array.isArray(mapsAndVersionsJSON) || !mapsAndVersionsJSON?.length) {
    return genericAPIError(res, 404, 'Maps not found');
  }
  const mismatchedMaps: Record<string, string> = {};
  bodyParams.forEach((value) => {
    const map = mapsAndVersionsJSON.find(
      (m) => m.identifier === value.identifier
    );
    if (!map) {
      return;
    }
    if (map.version !== value.version) {
      mismatchedMaps[value.identifier] = value.version;
    }
  });
  res.json(mismatchedMaps);
});

export default MapSyncRouter;
