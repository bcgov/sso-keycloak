import sequelize from './modules/sequelize/config';

afterAll(async () => {
  await sequelize.close();
});
