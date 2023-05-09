import 'dotenv/config';
import { LightIndexer } from './LightIndexer';
import { Chains, LightIndexerConfig } from './types';

/**
 * (Required) Configuration object for the LightIndexer instance.
 * @type {LightIndexerConfig}
 */

const config: LightIndexerConfig = {
  server: {
    port: process.env.PORT, // (Required)
    authorization: process.env.AUTHORIZATION, // (Required)
  },
  // (Required)
  syncer: {
    chain: process.env.CHAIN as Chains, // (Required)
    contracts: process.env.CONTRACTS ? process.env.CONTRACTS.split(',') : [], // (Optional)
    apiKey: process.env.API_KEY as string, // (Required)
    workerCount: process.env.WORKER_COUNT, // (Optional)
    managerCount: process.env.MANAGER_COUNT, // (Optional)
    toSync: {
      asks: process.env.SYNC_ASKS === '1',
      sales: process.env.SYNC_SALES === '1', // (Optional)
    },
  },
  // (Optional)
  ...(process.env.DATADOG_APP_NAME &&
    process.env.DATADOG_API_KEY && {
      datadog: {
        appName: process.env.DATADOG_APP_NAME,
        apiKey: process.env.DATADOG_API_KEY,
      },
    }),
  // (Optional)
  ...(process.env.REDIS_URL && {
    backup: {
      redisUrl: process.env.REDIS_URL,
      useBackup: process.env.USE_BACKUP == '1',
    },
  }),
};

/**
 * Launches the LightIndexer instance with the given configuration.
 */
LightIndexer.launch(config);
