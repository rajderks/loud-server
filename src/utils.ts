import path from 'path';
import fs from 'fs';
import { path as rootPath } from 'app-root-path';
import { File } from './types';
import { Response } from 'express';

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

const genericAPIError = (res: Response, status: number, message: string) => {
  res.status(status).json({
    status,
    message,
  });
};

const mapPath = (token: string) =>
  path.normalize(path.resolve(`${rootPath}/`, process.env.MAP_ROOT_DEV, token));

const mapWrite = (file: File, image: File, token: string) => {
  const filePath = path.normalize(path.join(mapPath(token), file.originalname));
  const imagePath = path.normalize(
    path.join(mapPath(token), image.originalname)
  );
  fs.mkdirSync(mapPath(token), { recursive: true });
  fs.writeFileSync(filePath, file.buffer);
  fs.writeFileSync(imagePath, image.buffer);
  return { filePath, imagePath };
};

export { genericAPIError, objectReduceMissingKeys, mapPath, mapWrite };
