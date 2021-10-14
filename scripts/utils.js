const fs = require('fs');
const crypto = require('crypto');
const _ = require('lodash');

const readJSON = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8'));

const createTemplate = (filename) => {
  const base = readJSON(filename);
  return (data) => _.merge({}, base, data);
};

async function generateSecret(length = 48) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(length, (err, buffer) => {
      if (err) reject(err);
      else resolve(buffer.toString('hex'));
    });
  });
}

module.exports = { readJSON, createTemplate, generateSecret };
