import { RequestHandler } from 'express';

const authorizePostMiddleware: RequestHandler = (req, res, next) => {
  if (req.method.toLowerCase() === 'put') {
    if (req.query.token !== process.env.API_ADMIN_TOKEN) {
      return res.sendStatus(403);
    }
  }
  next();
};

export default authorizePostMiddleware;
