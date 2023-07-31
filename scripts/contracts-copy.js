/* eslint-disable */
const fs = require("fs");

try {
  fs.copyFileSync("contracts.txt", "dist/contracts.txt");
} catch (e) {
  console.log(`Error copying contracts: ${e}`);
}
