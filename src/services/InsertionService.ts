/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Prisma, PrismaClient } from '@prisma/client';
import { AsksSchema, SalesSchema } from './WebSocketService';

/**
 * {
    datasets: ['asks', 'bids'],
    table: 'all_orders',
  },
  {
    datasets: ['bids'],
    table: 'bids',
  },
  {
    datasets: ['sales'],
    table: 'sales',
  },
 */

type DataTypes = 'sales' | 'asks';

type DataSets = AsksSchema[] | SalesSchema[];

interface InsertionServiceConfig {
  mappings: {
    datasets: DataTypes[];
    table: string;
  }[];
}

class _InsertionServivce {
  /**
   * _instance
   * Prisma orm instance
   * @access private
   */
  private _prisma: PrismaClient = new PrismaClient();

  /**
   * # _config
   * Insertion service config
   * @access private
   */
  private _config: InsertionServiceConfig = {
    mappings: [],
  };

  /**
   * Constructs and sets the service
   * @returns void
   */
  public construct(config: InsertionServiceConfig): void {
    this._config = config;
  }
  /**
   * # launch
   * Launches the InsertionService
   * @access public
   * @returns void
   */
  public async launch(): Promise<void> {
    await this._prisma.$connect();
  }

  /**
   * Handles resolved & rejected prisma promises.
   * @param promises Prisma promise results
   * @return void
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
   * Creates or updates a row on a table
   * @param table database table
   * @param data row data
   * @returns void
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

  /** Counts the number of records in a database
   * @access private
   * @param table - database table.
   * @returns int
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

export const InsertionService = new _InsertionServivce();
