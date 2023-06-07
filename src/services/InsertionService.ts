/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DataSets, DataTypes, InsertionServiceConfig } from '../types';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * The _InsertionService class provides an interface to the Prisma ORM.
 * This service handles database connections, data upserts, and record counting.
 */
class _InsertionServivce {
  /**
   * Prisma ORM instance
   * @access private
   * @type {PrismaClient}
   */
  private _prisma: PrismaClient = new PrismaClient();

  /**
   * Insertion service configuration object
   * @access private
   * @type {InsertionServiceConfig}
   */
  private _config: InsertionServiceConfig = {
    mappings: [],
  };

  /**
   * Configures the insertion service with a given configuration.
   * @param {InsertionServiceConfig} config - Insertion service configuration object.
   * @returns {void}
   */
  public construct(config: InsertionServiceConfig): void {
    this._config = config;
  }

  /**
   * Initiates the connection to the database through Prisma.
   * @returns {Promise<void>}
   */
  public async launch(): Promise<void> {
    await this._prisma.$connect();
  }

  /**
   * Handles the resolution or rejection of Prisma promises.
   * @param {PromiseSettledResult<Prisma.PrismaPromise<T>>[]} promises - Prisma promise results.
   * @returns {Promise<void>}
   */
  private async _handlePrismaPromises<T>(
    promises: PromiseSettledResult<Prisma.PrismaPromise<T>>[]
  ): Promise<void> {
    promises.map((promise) => {
      if (
        !(promise instanceof Prisma.PrismaClientKnownRequestError) ||
        !(promise instanceof Prisma.PrismaClientValidationError)
      )
        return;

      switch (promise.code) {
        // Timeout
        case 'P1008':
          break;
        // Invalid data format
        case 'P2000':
          break;
        // Unique constraint failed
        case 'P2002':
          break;
        // Invalid data
        case 'P2005':
          break;
        // Invalid data
        case 'P2006':
          break;
        // Integer Overflow
        case 'P2020':
          break;
        default:
          break;
      }
    });
  }

  /**
   * Provides the PrismaClient instance for the caller.
   * @returns {PrismaClient}
   */
  public getClient(): PrismaClient {
    return this._prisma;
  }

  /**
   * Inserts new data or updates existing data in the database.
   * @param {DataTypes} type - Type of the data to be upserted.
   * @param {DataSets} data - The actual data to be upserted.
   * @returns {Promise<void>}
   */
  public async upsert(type: DataTypes, data: DataSets): Promise<void> {
    this._handlePrismaPromises(
      await Promise.allSettled(
        this._config.mappings
          .filter(({ datasets }) => datasets.includes(type))
          .flatMap(({ table }) =>
            data.map((set) =>
              // @ts-ignore Prisma doesn't support model reference by variable name.
              // See https://github.com/prisma/prisma/discussions/16058#discussioncomment-54936
              this._prisma[table].upsert({
                where: { id: set.id },
                create: set,
                update: set,
              })
            )
          )
      )
    );
  }

  /**
   * Counts the number of records in a specified database table.
   * @access private
   * @param {DataSets} table - Name of the database table.
   * @returns {Promise<number>}
   */
  public async _count(table: DataSets): Promise<number> {
    try {
      // @ts-ignore Prisma doesn't support model reference by variable name.
      // See https://github.com/prisma/prisma/discussions/16058#discussioncomment-5493686
      const count = await this._prisma[table].count({});
      return count;
    } catch (err: unknown) {
      return 0;
    }
  }
}

/**
 * The InsertionService is an instance of the _InsertionService class,
 * allowing for singleton-like usage throughout the application.
 */
export const InsertionService = new _InsertionServivce();
