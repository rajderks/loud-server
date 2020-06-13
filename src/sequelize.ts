import { Sequelize } from 'sequelize';
import log from './log';

let dbConfig = null;
if (process.env.NODE_ENV === 'production') {
  log.info('loading production creds');
  dbConfig = process.env.DATABASE_URL;
} else {
  log.info('loading development creds');
  dbConfig = process.env.DATABASE_URL_DEV;
}

const sequelize = new Sequelize(dbConfig, {
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
