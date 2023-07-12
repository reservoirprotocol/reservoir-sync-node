import 'dotenv/config';
import { SyncNode } from './SyncNode';
import { SyncNodeConfig } from './types';
const config: SyncNodeConfig = {
  syncer: {
    chain: 'mainnet',
    apiKey: process.env.API_KEY as string,
  },
  server: {
    port: 1111,
    authorization: 'default',
  },
  backup: {
    useBackup: true,
  },
  logger: {
    datadog: {
      apiKey: 'xxxx-xxxx-xxxx',
      appName: 'sync-node',
    },
  },
};

const node = new SyncNode(config);

node.launch();
