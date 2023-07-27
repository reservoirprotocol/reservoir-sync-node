/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-implicit-any-catch */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

try {
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
  console.log(`READ CONTRACTS`);
  return;
} catch (e) {
  console.log(`ERROR READING CONTRACTS: ${e}`);
  return;
}
