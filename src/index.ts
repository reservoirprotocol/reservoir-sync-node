import 'dotenv/config';
import { Controller } from './queue/Controller';
import { Chains, DataTypes, SyncNodeConfig } from './types';

const config: SyncNodeConfig = {
  syncer: {
    chain: 'mainnet',
    apiKey: process.env.API_KEY as string,
    mappings: [
      {
        datasets: ['asks'],
        table: 'asks',
        contracts: [],
      },
      {
        datasets: ['sales'],
        table: 'sales',
        contracts: [],
      },
    ],
  },
  server: {
    port: 1111,
    authorization: 'default',
  },
  logger: {
    datadog: {
      apiKey: 'xxxx-xxxx-xxxx',
      appName: 'sync-node',
    },
  },
};

// export const node = new SyncNode(config);
type Mode = 'slow' | 'normal' | 'fast';
interface Mapping {
  datasets: DataTypes[];
  type: {
    root: 'sales' | 'orders';
    dataset: 'sales' | 'asks' | 'bids';
  };
  table: string;
}
interface ControllerConfig {
  apiKey: string;
  mapping: Mapping;
  chain: Chains;
  contracts: string[];
  delay: number;
  mode: Mode;
}

const controller = new Controller({
  apiKey: process.env.API_KEY as string,
  mapping: {
    datasets: ['sales'],
    type: {
      root: 'sales',
      dataset: 'sales',
    },
    table: 'sales',
  },
  chain: 'mainnet',
  contracts: [],
  delay: 0,
  mode: 'fast',
});

// node.launch();
