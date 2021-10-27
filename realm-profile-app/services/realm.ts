import { instance } from './axios';
import { RealmProfile } from 'types/realm-profile';

export const getRealmProfiles = async (): Promise<[RealmProfile[], null] | [null, any]> => {
  try {
    const result = await instance.get('realms/all').then((res) => res.data);
    return [result as RealmProfile[], null];
  } catch (err: any) {
    console.error(err);
    return [null, err];
  }
};

export const getRealmProfile = async (id: string): Promise<[RealmProfile, null] | [null, any]> => {
  try {
    const result = await instance.get(`realms/one?id=${id}`).then((res) => res.data);
    return [result as RealmProfile, null];
  } catch (err: any) {
    console.error(err);
    return [null, err];
  }
};

export const updateRealmProfile = async (id: string, data: RealmProfile): Promise<[any, null] | [null, any]> => {
  try {
    const result = await instance.put(`realms/one?id=${id}`, data).then((res) => res.data);
    return [result as RealmProfile, null];
  } catch (err: any) {
    console.error(err);
    return [null, err];
  }
};
