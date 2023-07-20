import express, { Application, NextFunction, Request, Response } from 'express';
// import { createHandler } from 'graphql-http/lib/use/express';
// import { GraphQlService } from '../services';
import {
  Backup,
  Block,
  DataTypes,
  InsertionDataPoint,
  ProcessCommand,
  ServerConfig,
} from '../types';
import routes from './routes';
import cors from 'cors';
import { RedisClientType, createClient } from 'redis';

/**
 * The _Server class encapsulates an Express application and provides methods for
 * setting up the server, including route handlers and middleware.
 */
class _Server {
  /**
   * The Express application instance.
   * @access private
   * @type {Application}
   */
  private _app: Application = express();

  private _client: RedisClientType = createClient({
    url: process.env.REDIS_URL as string,
  });

  /**
   * Configuration object for the server.
   * @access private
   * @type {ServerConfig}
   */
  private _config: ServerConfig = {
    port: 0,
    authorization: '',
  };

  private _insertionsOverTime: Record<
    DataTypes | string,
    InsertionDataPoint[]
  > = {};

  /**
   * Launches the server and starts listening on the configured port.
   * @returns {Promise<void>}
   */
  public async launch(): Promise<void> {
    this._client.on('error', (err) =>
      // eslint-disable-next-line no-console
      console.log('Servier: Failed to connect to redis', err)
    );
    process.on('message', (message: ProcessCommand) => {
      if (message.command && message.dataType) {
        switch (message.command) {
          case 'record_insertions': {
            if (!this._insertionsOverTime[message.dataType]) {
              this._insertionsOverTime[message.dataType] = [];
            }
            this._insertionsOverTime[message.dataType].push({
              timestamp: new Date().toISOString(),
              recordCount: message?.recordCount || 0,
            });

            this._insertionsOverTime[message.dataType] =
              this._aggregateInsertions(
                this._insertionsOverTime[message.dataType]
              );
            break;
          }
        }
      }
    });
    await this._client.connect();
    return new Promise((resolve) => {
      this._app.listen(this._config.port, () => {
        // eslint-disable-next-line no-console
        console.log('Server Service Launched');
        resolve();
      });
    });
  }

  /**
   * Configures the server with routes, middleware, and other settings.
   * @param {ServerConfig} config - Server configuration object.
   * @returns {void}
   */
  public construct(config: ServerConfig) {
    this._config = config;
    this._app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
    this._app.use('*', (req: Request, res: Response, next: NextFunction) => {
      if (
        req.method !== 'OPTIONS' &&
        req.get('Authorization') !== this._config.authorization
      ) {
        res.status(403).json({
          error: {
            status: 403,
            message: 'Unauthorized',
          },
          data: null,
        });
      } else {
        next('route');
      }
    });

    routes.forEach((route) => {
      this._app.use(route.path, route.handlers);
    });

    // Object.keys(GraphQlService.getSchema()).forEach((key) => {
    //   this._app.use(
    //     `/graphql/${key}/`,
    //     createHandler({ schema: GraphQlService.getSchema()[''] })
    //   );
    // });

    this._app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: {
          status: 404,
          message: 'Route not found.',
        },
        data: null,
      });
    });
  }

  /**
   * Retrieves all blocks of the given datatype from the queue.
   *
   * @param datatype - The type of the data to be retrieved
   * @returns A promise that resolves to an array of blocks
   * @public
   */
  public async getAllBlocks(datatype: DataTypes): Promise<Block[]> {
    try {
      const blocks = await this._client.lRange(`${datatype}-queue`, 0, -1);
      return blocks
        ? (blocks.map((block) => JSON.parse(block)) as Block[])
        : [];
    } catch (e: unknown) {
      return [];
    }
  }

  /**
   * Retrieves all backups from the queue.
   *
   * @returns A promise that resolves to an hash of backups
   * @public
   */

  public async getBackups(): Promise<Record<string, Backup>> {
    try {
      const backups = Object.fromEntries(
        Object.entries(await this._client.hGetAll('backups')).map(
          ([key, value]) => [key, JSON.parse(value) as Backup]
        )
      );
      return backups;
    } catch (e: unknown) {
      return {};
    }
  }

  /**
   * Retrieves all insertions reported from the SyncNode
   *
   * @returns A promise that resolves to an array of insertions
   * @public
   */

  public getInsertions(): Record<DataTypes | string, InsertionDataPoint[]> {
    try {
      return this._insertionsOverTime;
    } catch (e: unknown) {
      return {};
    }
  }

  /**
   * Aggregate insertions by the hour
   *
   * @returns void
   * @private
   */

  private _aggregateInsertions(
    dataArray: { timestamp: string; recordCount: number }[]
  ) {
    // Create an object to store the reduced data
    const reducedData: {
      [hour: number]: {
        timestamp: string;
        recordCount: number;
      };
    } = {};

    // Loop through the dataArray and group objects by hour
    dataArray.forEach((obj) => {
      const timestamp = new Date(obj.timestamp);
      const hour = timestamp.getHours();

      // If the hour key doesn't exist in the reducedData, create it with an initial recordCount of 0
      if (!reducedData[hour]) {
        reducedData[hour] = {
          timestamp: timestamp.toISOString(),
          recordCount: 0,
        };
      }

      // Add the current object's recordCount to the corresponding hour in the reducedData
      reducedData[hour].recordCount += obj.recordCount;
    });

    // Convert the reducedData object to an array of objects
    const reducedArray = Object.values(reducedData);

    return reducedArray;
  }
}

/**
 * The Server object is an instance of the _Server class,
 * allowing for singleton-like usage throughout the application.
 */
export const Server = new _Server();
