/*
 * This is a very rough-edged example, the idea is to still work with the fact that oidc-provider
 * has a rather "dynamic" schema. This example uses sequelize with postgresql, and all dynamic data
 * uses JSON fields. id is set to be the primary key, grantId should be additionaly indexed for
 * models where these fields are set (grantId-able models). userCode should be additionaly indexed
 * for DeviceCode model. uid should be additionaly indexed for Session model.
 */

import { Op, Sequelize } from 'sequelize';
import models from './models';

const sequelize = new Sequelize('databaseName', 'username', 'password', {
  host: 'databaseHost',
  dialect: 'postgres',
});

class SequelizeAdapter {
  model: any;
  name: string;
  constructor(name: string) {
    this.model = models.get(name);
    this.name = name;
  }

  async upsert(id: string, data: { grantId: any; userCode: any; uid: any }, expiresIn: number) {
    await this.model.upsert({
      id,
      data,
      ...(data.grantId ? { grantId: data.grantId } : undefined),
      ...(data.userCode ? { userCode: data.userCode } : undefined),
      ...(data.uid ? { uid: data.uid } : undefined),
      ...(expiresIn ? { expiresAt: new Date(Date.now() + expiresIn * 1000) } : undefined),
    });
  }

  async find(id: string) {
    const found = await this.model.findByPk(id);
    if (!found) return undefined;
    return {
      ...found.data,
      ...(found.consumedAt ? { consumed: true } : undefined),
    };
  }

  async findByUserCode(userCode: string) {
    const found = await this.model.findOne({ where: { userCode } });
    if (!found) return undefined;
    return {
      ...found.data,
      ...(found.consumedAt ? { consumed: true } : undefined),
    };
  }

  async findByUid(uid: string) {
    const found = await this.model.findOne({ where: { uid } });
    if (!found) return undefined;
    return {
      ...found.data,
      ...(found.consumedAt ? { consumed: true } : undefined),
    };
  }

  async destroy(id: string) {
    await this.model.destroy({ where: { id } });
  }

  async consume(id: string) {
    await this.model.update({ consumedAt: new Date() }, { where: { id } });
  }

  async revokeByGrantId(grantId: string) {
    await this.model.destroy({ where: { grantId } });
  }

  static async connect() {
    return sequelize.sync();
  }

  async listExpiredRecords() {
    return await this.model.findAll({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
      raw: true,
    });
  }
}

export default SequelizeAdapter;
