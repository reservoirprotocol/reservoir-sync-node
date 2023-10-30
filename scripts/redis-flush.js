/* eslint-disable */
require("dotenv/config");
const redis = require("redis");

const CONNECTION_URL = process.env.REDIS_URL;

(async () => {
  try {
    const client = redis.createClient({
      url: CONNECTION_URL,
    });

    await client.connect();

    await client.flushDb();
  } catch (error) {
    console.log(error);
  }
})();
