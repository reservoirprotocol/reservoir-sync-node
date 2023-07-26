/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const contracts = fs.readFileSync(
  path.join(__dirname, '../contracts.txt'),
  'utf-8'
);

let line = '';

line = contracts
  .trim()
  .split('\n')
  .map((contract) => contract.trim())
  .join(',');

fs.writeFileSync(path.join(__dirname, '../output.txt'), line, 'utf-8');
