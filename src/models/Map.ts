import Sequelize, { Model, BuildOptions } from 'sequelize';
import sequelize from '../sequelize';
import log from '../log';
import { mapIdentifierFromFilePath } from '../utils';
import { map } from 'bluebird';

const MAP_IDENTIFIER_DEFAULT_VALUE = '!!FIX!!';

export interface MapAttr {
  id?: number;
  author: string;
  description?: string;
  downloads: number;
  file: string;
  image: string;
  name: string;
  players: number;
  size: number;
  version: string;
  views: number;
  token: string;
  identifier: string;
}

class MapModel extends Model<MapAttr> {
  public static requiredKeys: Array<keyof MapAttr> = [
    'author',
    'image',
    'name',
    'players',
    'size',
    'version',
  ];
  public id!: number;
  public author!: string;
  public description?: string;
  public downloads!: number;
  public file!: string;
  public image!: number;
  public name!: string;
  public official!: number;
  public players!: number;
  public size!: number;
  public version!: string;
  public views!: number;
  public token!: string;
  // Map directory, same zip file name without scd
  public identifier!: string;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

MapModel.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    author: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    size: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    downloads: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    file: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    image: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    official: {
      type: Sequelize.BOOLEAN,
      defaultValue: 0,
    },
    players: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    views: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    version: {
      type: Sequelize.CHAR(10),
      allowNull: false,
    },
    token: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    identifier: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: MAP_IDENTIFIER_DEFAULT_VALUE,
    },
  },
  {
    sequelize,
    tableName: 'maps',
    paranoid: true,
    indexes: [
      { unique: true, fields: ['token'] },
      // { unique: true, fields: ['identifier'] },
    ],
  }
);

MapModel.sync({ alter: true }).then(
  async () => {
    log.info('Map table created');
    MapModel.findAll({
      where: {
        identifier: MAP_IDENTIFIER_DEFAULT_VALUE,
      },
    }).then(async (maps) => {
      const transaction = await sequelize.transaction({ autocommit: false });
      // Manual database migration
      // ## Fix 'identifier' column for earlier uploaded maps
      try {
        await (async () => {
          for (let map of maps) {
            const mapFile = map.get('file');
            if (!mapFile) {
              console.error('Could not fix map', map.toJSON());
              log.error('Could not fix map', map.toJSON());
              return;
            }
            const identifier = mapIdentifierFromFilePath(mapFile);
            map.identifier = identifier;
            await map.save({ transaction });
          }
        })();
        await transaction.commit();
      } catch (e) {
        await transaction.rollback();
        log.error(e);
        console.error(e);
      }
    });
  },
  (err) => {
    log.error('Map table not created', err);
  }
);

export default MapModel;
