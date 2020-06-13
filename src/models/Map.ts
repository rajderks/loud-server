import Sequelize, { Model, BuildOptions } from 'sequelize';
import sequelize from '../sequelize';
import log from '../log';

export interface MapAttr {
  id?: number;
  name: string;
  version: string;
}

class MapModel extends Model<MapAttr> {
  id!: Sequelize.NumberDataType;
  name!: Sequelize.StringDataType;
  version!: Sequelize.CharDataType;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MapModel.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    version: {
      type: Sequelize.CHAR(10),
      allowNull: false,
    },
  },
  { sequelize, tableName: 'maps' }
);

MapModel.sync().then(
  () => {
    log.info('Map tble created');
  },
  () => {
    log.error('Map table not created');
  }
);

export default MapModel;
