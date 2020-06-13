import { Response, Request } from 'express';

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

export { genericAPIError, objectReduceMissingKeys };
