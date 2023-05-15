/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllFromModel(model) {
  try {
    await prisma.$queryRaw(`DROP TABLE IF EXISTS "${model}";`);
  } catch (error) {
    console.error(`Error deleting records from ${model}: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllFromModel('asks');
