import { instance } from './axios';
import { RealmProfile, ModalData } from 'types/realm-profile';

export const getSurvey = async (): Promise<[any, null] | [null, any]> => {
  try {
    const result = await instance.get(`surveys/1`).then((res) => res.data);
    return [result as any, null];
  } catch (err: any) {
    console.error(err);
    return [null, err];
  }
};

export const answerSurvey = async (data: ModalData): Promise<[any, null] | [null, any]> => {
  try {
    const result = await instance.post(`surveys/1`, data).then((res) => res.data);
    return [result as any, null];
  } catch (err: any) {
    console.error(err);
    return [null, err];
  }
};
