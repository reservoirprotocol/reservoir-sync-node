const redis = require("redis");

(async () => {
  const client = redis.createClient();

  try {
    await client.flushdb();
    console.log("Redis DB flushed successfully.");
  } catch (error) {
    console.error("Error flushing Redis DB:", error);
  } finally {
    client.quit();
  }
})();
