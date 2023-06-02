/* eslint-disable @typescript-eslint/ban-ts-comment */
import { asks, PrismaClient, sales } from '@prisma/client';

type Tables = 'sales' | 'asks';
type DataSets = sales[] | asks[];

export class InsertionServivce {
  /**
   * _instance
   * Prisma orm instance
   * @access private
   */
  private _prisma: PrismaClient;

  constructor() {
    this._prisma = new PrismaClient();
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

  private async _upsert(table: Tables, data: DataSets): Promise<void> {
    try {
      await Promise.allSettled(
        data.map((set) => {
          // @ts-ignore Prisma doesn't support model reference by variable name.
          // See https://github.com/prisma/prisma/discussions/16058#discussioncomment-549368
          return this._prisma[table].upsert({
            where: {
              id: set.id,
            },
            create: set,
            update: set,
          });
        })
      );
    } catch (e: unknown) {
      // Queue this to be rehandled
    }
  }

  public upsert = async (table: Tables, data: DataSets): Promise<void> =>
    await this._upsert(table, data);

  /** Counts the number of records in a database
   * @access private
   * @param table - database table.
   * @returns int
   */
  private async _count(table: Tables): Promise<number> {
    try {
      // @ts-ignore Prisma doesn't support model reference by variable name.
      // See https://github.com/prisma/prisma/discussions/16058#discussioncomment-5493686
      const count = await this._prisma[table].count({});
      return count;
    } catch (err: unknown) {
      return 0;
    }
  }
  /** Counts the number of records in a databse
   * @access public
   * @param table {Table} database table
   * @returns int
   */
  public count = async (table: Tables): Promise<number> =>
    await this._count(table);
}
