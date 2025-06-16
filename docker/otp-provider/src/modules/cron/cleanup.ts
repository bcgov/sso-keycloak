import SequelizeAdapter from '../sequelize/adapter';
import { models } from '../sequelize/umzug';
import sequelizeModels from '../sequelize/models';

const ignoredModels = ['ClientConfig', 'Otp'];

export const cleanupTables = async () => {
  for (const table of models) {
    if (ignoredModels.includes(table)) continue;
    const model = new SequelizeAdapter(table);
    const expiredRecords = await model.listExpiredRecords();
    expiredRecords.map((record: any) => {
      model.destroy(record.id);
    });
  }

  const otpModel = sequelizeModels.get('Otp');
  await otpModel.destroy({
    truncate: true,
  });
};
