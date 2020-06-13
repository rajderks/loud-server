import Sequelize, { Model, BuildOptions } from 'sequelize';
import sequelize from '../sequelize';
import log from '../log';

export interface MapAttr {
  id?: number;
  author: string;
  description?: string;
  downloads: number;
  file: string;
  image: string;
  name: string;
  size: number;
  version: string;
  views: number;
}

class MapModel extends Model<MapAttr> {
  public static requiredKeys: Array<keyof MapAttr> = [
    'author',
    'image',
    'name',
    'size',
    'version',
  ];
  public id!: number;
  public author!: string;
  public description?: string;
  public downloads!: number;
  public file!: string;
  public image!: number;
  public name!: Sequelize.StringDataType;
  public size!: number;
  public version!: string;
  public views!: number;

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
      type: Sequelize.STRING,
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
    views: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    version: {
      type: Sequelize.CHAR(10),
      allowNull: false,
    },
  },
  { sequelize, tableName: 'maps', paranoid: true }
);

MapModel.sync({ alter: true }).then(
  () => {
    log.info('Map table created');
  },
  (err) => {
    log.error('Map table not created', err);
  }
);

export default MapModel;
