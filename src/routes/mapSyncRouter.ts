import express from 'express';
import bodyParser from 'body-parser';
import MapModel, { MapAttr } from '../models/Map';
import {
  objectReduceMissingKeys,
  genericAPIError,
  mapPath,
  mapWrite,
  mapDelete,
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

const MapSyncRouter = express.Router();
const upload = multer();

// for parsing application/json
MapSyncRouter.use(bodyParser.json());

MapSyncRouter.post('/', async (req, res) => {
  const bodyParams: Partial<MapAttr> = req.body;
  MapModel.findAll({ attributes: ['name', 'version'] });
});

export default MapSyncRouter;
