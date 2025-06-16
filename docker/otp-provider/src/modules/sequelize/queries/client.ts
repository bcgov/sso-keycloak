import { QueryOptions } from 'sequelize';
import models from '../models';

export const getClients = async (attributes: string[] = [], options: QueryOptions = { raw: true }) => {
  return await models.get('ClientConfig').findAll({
    attributes,
    ...options,
  });
};
