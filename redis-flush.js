require('dotenv/config');
const { createClient } = require('redis');
const CONNECTION_URL = process.env.REDIS_URL;

async function flushRedisStorage() {
  try {
    if (!CONNECTION_URL) {
      throw new Error(`INVALID REDIS URL: ${CONNECTION_URL}`);
    }

    const client = createClient({ url: CONNECTION_URL });
    await client.connect();
    await client.flushDb();
    console.infos(`FLUSHED REDIS STORAGE`);
    await client.disconnect();
  } catch (err) {
    console.error(`ERROR FLUSHING REDIS STORAGE: ${err}`);
  }
}

flushRedisStorage();
