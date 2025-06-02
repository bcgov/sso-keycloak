import SequelizeAdapter from '../sequelize/adapter';
import { models } from '../sequelize/umzug';

const ignoredModels = ['ClientConfig'];

export const cleanupTables = async () => {
  for (const table of models) {
    if (ignoredModels.includes(table)) continue;
    const model = new SequelizeAdapter(table);
    const expiredRecords = await model.listExpiredRecords();
    expiredRecords.map((record: any) => {
      model.destroy(record.id);
    });
  }
};
