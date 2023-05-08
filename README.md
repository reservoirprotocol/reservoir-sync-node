
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

# Backup configuration
# (Optional) Sign up for a free redis cloud instance http://redis.com/try-free/
# REDIS_URL= 

# Syncer configuration
# (Required) Enable or disable the syncing of sales (1 = true | 0 = false)
SYNC_SALES=0 
# (Required) Enable or disable the syncing of asks (1 = true | 0 = false)
SYNC_ASKS=0

CHAIN=mainnet # (Required) Chain to sync - Supports: 'rinkeby' 'goerli'
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
 * (Required) Configuration object for the LightNode instance.
 * @type {LightNodeConfig}
 */

const config: LightNodeConfig = {
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

### Configuration - (Redis) Backups
LightNode also uses the [Redis](https://www.redis.com) to store temporary backups of the current state of the LightNode in case it is to go down.
This allows the LightNode to restart right where it left off.
For easy an easy no hassle setup use: https://redis.com/try-free.

To configure please setup the `.env` as shown below: 
```env
REDIS_URL=your-redis-url
```

### Usage
To launch the LightNode, run the command below: 
```
yarn start
```
### Advanced Usage Guide

#### Scripts
The LightNode also has several scripts that can be used to reset the backup and database:

```
yarn database:purge // -> Resets database forcefully
yarn backup:purge // -> Flushes the current backup
```
#### OTA Updates
The LightNode's express server provides a `/sync/create` endpoint, which allows you to add new contracts for backfilling and upkeep. To utilize this feature, you need to send a POST request with the required query parameters:

- `type=TABLE_NAME`
- `contract=CONTRACT_ID`

In the `type` parameter, specify either "asks" or "sales" based on your requirements. For the `contract` parameter, provide a valid contract ID corresponding to the blockchain your LightNode is operating on.

An example of a complete POST request is shown below:

```cURL
curl --location --request POST 'http://your-server.com/sync/create?type=ask&contract=0xed5af388653567af2f388e6224dc7c4b3241c544'
```

This request will add the specified contract to the LightNode for backfilling and upkeeping.

