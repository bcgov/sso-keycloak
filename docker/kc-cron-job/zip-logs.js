const fsPromises = require('fs').promises;
const fs = require('fs');
const archiver = require('archiver');
const { saveFilesToDatabase } = require('./event-logs');
const axios = require('axios');

const { DIRECTORY = '/var/log/eap', EXPIRY_LENGTH_DAYS = 30, TEMP_DIRECTORY = './tmp', RC_WEBHOOK = '' } = process.env;
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
  console.info(`Creating new Directories in ...${baseDir}, e.g ${newDirNames[0]}`);
  fs.mkdirSync(baseDir);
  const promises = newDirNames.map((newDirName) => fsPromises.mkdir(`${baseDir}/${newDirName}`));
  return Promise.all(promises);
};

const copyFilesToDateFolder = async (srcDir, destDir, fileNames) => {
  console.info(`Copying files from ${srcDir} to ${destDir}, e.g ${fileNames[0]}`);
  return fileNames.map((filename) => {
    const fileNameDate = getFileDate(filename);
    return fsPromises.copyFile(`${srcDir}/${filename}`, `${destDir}/${fileNameDate}/${filename}`);
  });
};

const zipFolders = async (srcDir, destDir) => {
  console.info('Zipping logs...');
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
    })
  );
};

const deleteFiles = async (dirname, filenames) =>
  Promise.all(filenames.map((filename) => fsPromises.rm(`${dirname}/${filename}`)));

const deleteOldZipFiles = async (dirname, expiryLengthDays) => {
  console.info('Deleting old files...');
  const [allZippedFiles] = await getDatedLogFiles(dirname, endsWithDateZippedRegex);
  const zippedFileDates = allZippedFiles.map((filename) => filename.split('.zip')[0]);

  const now = new Date();
  const oldestAllowedDate = new Date().setDate(now.getDate() - expiryLengthDays);

  const filesToDelete = zippedFileDates
    .filter((stringDate) => new Date(stringDate) < oldestAllowedDate)
    .map((stringDate) => `${stringDate}.zip`);

  return deleteFiles(dirname, filesToDelete);
};

async function sendRocketChatAlert(message, type) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const payload = { projectName: 'kc-cron-job', message, statusCode: type };

  await axios
    .post(RC_WEBHOOK, payload, { headers })
    .then((res) => {
      console.log('rocket.chat alert triggered successfully');
    })
    .catch((err) => {
      console.error('failed to trigger rocket.chat alert', err);
    });
}

async function main(dirname) {
  try {
    const [datedFileNames, uniqueDates] = await getDatedLogFiles(dirname, endsWithDateRegex);
    await createDateDirectories(TEMP_DIRECTORY, uniqueDates);
    await copyFilesToDateFolder(dirname, TEMP_DIRECTORY, datedFileNames);
    await saveFilesToDatabase(TEMP_DIRECTORY);
    await zipFolders(TEMP_DIRECTORY, dirname);
    await deleteFiles(dirname, datedFileNames);
    await deleteOldZipFiles(dirname, EXPIRY_LENGTH_DAYS);
  } catch (err) {
    console.log(err);
    await sendRocketChatAlert(err.message, 'ERROR');
  } finally {
    try {
      await fsPromises.rmdir(TEMP_DIRECTORY, { recursive: true, force: true });
      console.log('Done');
    } catch (err) {
      console.log(err);
      await sendRocketChatAlert(err.message, 'ERROR');
    }
  }
}

main(DIRECTORY);
