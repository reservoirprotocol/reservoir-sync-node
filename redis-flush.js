require('dotenv/config');
const { createClient } = require('redis');

/**
 * # flush
 * Flushes a redis database
 * @returns void
 */
const flush = () => {
  const client = createClient({
    url: process.env.REDIS_URL,
  });
  client.on('error', (err) => {
    console.error('ERROR CONNECTING TO REDIS: ', err);
    process.exit(1);
  });
  client.on('connect', () => {
    client.flushDb((err, res) => {
      if (err) {
        console.error('ERROR FLUSHING DATABASE: ', err);
        process.exit(1);
      } else {
        console.log('FLUSHED REDIS DATABSE');
        client.quit();
        process.exit(0);
      }
    });
  });
};

flush();
