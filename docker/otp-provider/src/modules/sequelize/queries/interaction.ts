import { QueryOptions } from 'sequelize';
import models from '../models';

export const getInteractionById = async (id: string, options: QueryOptions = { raw: true }) => {
  return await models.get('Interaction').findOne({
    where: { id },
    ...options,
  });
};
