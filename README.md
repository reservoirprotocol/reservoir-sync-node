
## Light-Node BETA

Reservoir Light-Node is a customizable lightweight indexer based on the Reservoir indexer. It's easy to set up, customizable, and fast.

![LightNode Logo Placeholder](https://dashboard.reservoir.tools/reservoir.svg)
### Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Contribute](#contribute)

### Installation
To install the required dependencies for the LightNode, run:

```bash
yarn installl
```

### Configuration - ENV
Included is an example .env file (example.env). Rename it to .env and configure as shown below:
```
# Database configuration
DATABASE_URL=your-postgres-database-url # (Required) PostgresSQL database to pipe data into

# Server configuration

PORT= # (Required) Port to spawn the server on
AUTHORIZATION= # (Required) Server authorization string

# Logger configuration
# (Optional) Datadog app name to send internal logs too
#DATADOG_APP_NAME=
# (Optional) Datadog api key for the above app
#DATADOG_API_KEY=
# Databse Configuration
DATABASE_URL=your-postgres-database-url # (Required) Database to pipe data into

# Syncer configuration

CHAIN=mainnet # (Required) Chain to sync - Supports: 'rinkeby' 'goerli' 'polygon' 'mainnet'.
API_KEY=your_reservoir_api_key # (Required) Reservoir API key - Sign up for free https://reservoir.tools/

# (Optional) Contracts to filter by - i.e., Only these contracts will be indexed.
# CONTRACTS=contract1,contract2,contract3

# (Optional) (Default: 1) Number of workers to be used by the syncers
# WORKER_COUNT=

# (Optional) (Default: 1) Number of managers to be used by the syncers
# MANAGER_COUNT=
```

### Configuration - LightNode
To configure the LightNode, navigate to the `index.ts` file and edit the configuration: 
```typescript
import 'dotenv/config';
import { LightNode } from './LightNode';
import { Chains, LightNodeConfig } from './types';

/**
 * Configuration object for the LightNode instance.
 * @type {LightNodeConfig}
 */
const config: LightNodeConfig = {
  // (Required)
  server: {
    port: Number(process.env.PORT), // (Required)
    authorization: process.env.AUTHORIZATION, // (Required)
  },
  // (Optional)
  backup: {
    redisUrl: process.env.REDIS_URL,
    useBackup: true, 
  },
  // (Optional)
  logger: {
    datadog: {
      appName: process.env.DATADOG_APP_NAME as string,
      apiKey: process.env.DATADOG_API_KEY as string,
    },
  },
  // (Required)
  syncer: {
    chain: process.env.CHAIN as Chains, // (Required)
    contracts: process.env.CONTRACTS ? process.env.CONTRACTS.split(',') : [], // (Optional) 
    apiKey: process.env.API_KEY as string, // (Required)
    workerCount: Number(process.env.WORKER_COUNT), // (Optional)
    managerCount: Number(process.env.MANAGER_COUNT), // (Optional)
    toSync: {
      sales: true, // (Optional)
    },
  },
};

/**
 * Launches the LightNode instance with the given configuration.
 */
LightNode.launch(config);


```
### Configuration - (Prisma) Database
LightNode also uses the [Prisma ORM](https://www.prisma.io) to interact with a PostgresSQL datbase.

To configure please setup the `.env` as shown below: 
```env
DATABASE_URL=your-postgres-database-url
```
For assistance setting up Prisma please visit their [documentation](https://www.prisma.io/docs).


### Usage
To launch the LightNode, run the command below: 
```
yarn start
```
Per our testing, below are some statistics on the avg hours required to backfill data since 2018:
