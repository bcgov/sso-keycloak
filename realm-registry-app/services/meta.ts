import { instance } from './axios';

export const getMinistries = async (): Promise<[string[], null] | [null, any]> => {
  try {
    const result = await instance.get('meta/ministry').then((res) => res.data);
    return [result as string[], null];
  } catch (err: any) {
    console.error(err);
    return [null, err];
  }
};

export const getDivisions = async (ministry: string): Promise<[string[], null] | [null, any]> => {
  try {
    const result = await instance.get(`meta/division?ministry=${ministry}`).then((res) => res.data);
    return [result as string[], null];
  } catch (err: any) {
    console.error(err);
    return [null, err];
  }
};

export const getBranches = async (ministry: string, division: string): Promise<[string[], null] | [null, any]> => {
  try {
    const result = await instance.get(`meta/branch?ministry=${ministry}&division=${division}`).then((res) => res.data);
    return [result as string[], null];
  } catch (err: any) {
    console.error(err);
    return [null, err];
  }
};
