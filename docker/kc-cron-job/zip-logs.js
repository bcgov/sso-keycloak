const _ = require('lodash');
const { Client } = require('pg');
const format = require('pg-format');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fsPromises = require('fs').promises;
const fs = require('fs');
const readline = require('readline');
const archiver = require('archiver');

const { DIRECTORY = '/var/log/eap', EXPIRY_LENGTH_DAYS = 10 } = process.env;
const endsWithDateRegex = /\d{4}-\d{2}-\d{2}$/;
const endsWithDateZippedRegex = /\d{4}-\d{2}-\d{2}.zip$/;

const getFileDate = (filename) => filename.match(endsWithDateRegex) && filename.match(endsWithDateRegex)[0];

const getFilesByRegex = async (dirname, regex) =>
  fsPromises.readdir(dirname).then((filenames) => filenames.filter((name) => name.match(regex)));

const getDatedLogFiles = async (dirname, regex) => {
  const datedFileNames = getFilesByRegex(dirname, regex);
  const uniqueDates = datedFileNames.then((filenames) => {
    const fileNameDates = filenames.map((filename) => getFileDate(filename));
    return [...new Set(fileNameDates)];
  });
  return Promise.all([datedFileNames, uniqueDates]);
};


const createDateDirectories = async (baseDir, newDirNames) => {
  fs.mkdirSync(baseDir);
  const promises = newDirNames.map((newDirName) => fsPromises.mkdir(`${baseDir}/${newDirName}`));
  return Promise.all(promises);
};

const copyFilesToDateFolder = async (srcDir, destDir, fileNames) => {
  return fileNames.map((filename) => {
    const fileNameDate = getFileDate(filename);
    return fsPromises.copyFile(`${srcDir}/${filename}`, `${destDir}/${fileNameDate}/${filename}`);
  });
};

const zipFolders = async (srcDir, destDir) => {
  const foldersToZip = await fsPromises.readdir(srcDir);

  return Promise.all(
    foldersToZip.map((folderName) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const stream = fs.createWriteStream(`${destDir}/${folderName}.zip`);
      return new Promise((resolve, reject) => {
        archive
          .directory(`${srcDir}/${folderName}`, false)
          .on('error', (err) => reject(err))
          .pipe(stream);
        stream.on('close', () => resolve());
        archive.finalize();
      });
    }),
  );
};

const deleteFiles = async (dirname, filenames) =>
  Promise.all(filenames.map((filename) => fsPromises.rm(`${dirname}/${filename}`)));

const deleteOldZipFiles = async (dirname, expiryLengthDays) => {
  const [allZippedFiles] = await getDatedLogFiles(dirname, endsWithDateZippedRegex);
  const zippedFileDates = allZippedFiles.map(filename => filename.split('.zip')[0]);

  const now = new Date();
  const oldestAllowedDate = new Date().setDate(now.getDate() - expiryLengthDays);

  const filesToDelete = zippedFileDates
    .filter(stringDate => new Date(stringDate) < oldestAllowedDate)
    .map(stringDate => `${stringDate}.zip`);

  return deleteFiles(dirname, filesToDelete);
};

async function main(dirname) {
  try {
    const tempDirectory = './tmp';
    const [datedFileNames, uniqueDates] = await getDatedLogFiles(dirname, endsWithDateRegex);
    await createDateDirectories(tempDirectory, uniqueDates);
    await copyFilesToDateFolder(dirname, tempDirectory, datedFileNames);
    await zipFolders(tempDirectory, dirname);
    await deleteFiles(dirname, datedFileNames);
    await deleteOldZipFiles(dirname, EXPIRY_LENGTH_DAYS);
  } catch (err) {
    console.log(err);
  } finally {
    await fsPromises.rmdir('./tmp', { recursive: true, force: true });
    console.log('Done');
  }
}

main('./test-data');
