import { promises } from 'fs';

export const readTextFile = async (filePath: string) => {
  try {
    const contents = await promises.readFile(filePath, 'utf-8');
    return contents.split(/\r?\n/);
  } catch (err) {
    throw new Error('Unable to read file' + err);
  }
};
