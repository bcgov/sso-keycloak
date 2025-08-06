import { Transaction } from 'sequelize';
import models from '../models';

const eventModel = models.get('Event');

type EventType = {
  eventType: string;
  clientId: string;
  email: string;
};

export const createEvent = async (event: EventType, transaction?: Transaction) => {
  return await eventModel.create(
    {
      eventType: event.eventType,
      clientId: event.clientId,
      email: event.email,
    },
    {
      transaction,
    },
  );
};
