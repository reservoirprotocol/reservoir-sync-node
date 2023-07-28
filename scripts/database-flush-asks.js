/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$queryRaw`DELETE FROM asks;`;
  } catch (error) {
    console.log(error);
  } finally {
    await prisma.$disconnect();
  }
})();
