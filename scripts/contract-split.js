/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const contracts = [];

fs.readFileSync(path.join(__dirname, '../contracts.txt'), 'utf-8')
  .trim()
  .split('\n')
  .map((contract) => contracts.push(contract));

fs.writeFileSync(
  path.join(__dirname, '../contracts.json'),
  JSON.stringify(contracts),
  'utf-8'
);
