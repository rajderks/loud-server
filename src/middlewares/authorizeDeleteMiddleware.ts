import express from 'express';

const AuthorizeDeleteMiddleware = express.Router();

AuthorizeDeleteMiddleware.use((req, res, next) => {
  if (req.method.toLowerCase() === 'delete') {
    if (req.query.token !== process.env.API_ADMIN_TOKEN) {
      return res.sendStatus(403);
    }
  }
  next();
});

export default AuthorizeDeleteMiddleware;
