import path from 'path';
import fs from 'fs';
import { sync as rimraf } from 'rimraf';
import { path as rootPath } from 'app-root-path';
import { File } from './types';
import { Response } from 'express';
import { off } from 'process';

/**
 * Finds all missing keys in provided object
 * @param object
 * @param required
 */
const objectReduceMissingKeys = <
  T extends { [key: string]: any },
  K extends keyof T
>(
  object: T,
  required: K[]
) => {
  const missingRequirements = required.reduce((acc: K[], key) => {
    if ((object?.[key] ?? null) === null) {
      acc.push(key);
    }
    return acc;
  }, []);
  return missingRequirements;
};

const genericAPIError = (
  res: Response,
  status: number,
  message: string | Record<string, any>
) => {
  res.status(status).json({
    status,
    message,
  });
};

const mapPath = (token: string) =>
  process.env.NODE_ENV === 'production'
    ? path.join(process.env.MAP_ROOT, '/', token)
    : path.normalize(
        path.resolve(`${rootPath}/`, process.env.MAP_ROOT_DEV, token)
      );

const mapIdentifierFromFilePath = (filePath: string) => {
  if (!filePath.endsWith('.scd')) {
    throw new Error(`filePath is not .scd ${filePath}`);
  }
  return path.basename(filePath).substr(0, path.basename(filePath).length - 4);
};

const mapWrite = (file: File, image: File, token: string) => {
  const filePath = path.normalize(path.join(mapPath(token), file.originalname));
  const imagePath = path.normalize(
    path.join(mapPath(token), image.originalname)
  );
  fs.mkdirSync(mapPath(token), { recursive: true });
  fs.writeFileSync(filePath, file.buffer);
  fs.writeFileSync(imagePath, image.buffer);
  return {
    filePath: `maps/${token}/${file.originalname}`,
    imagePath: `maps/${token}/${image.originalname}`,
  };
};

const mapDelete = (token: string) => {
  const filePath = mapPath(token);
  rimraf(filePath);
};

export {
  genericAPIError,
  objectReduceMissingKeys,
  mapPath,
  mapWrite,
  mapDelete,
  mapIdentifierFromFilePath,
};
