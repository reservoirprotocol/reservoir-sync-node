import { Prisma, PrismaClient } from '@prisma/client';
import { Delete, Query, Tables } from '../types';

/**
 * _InsertionService is a wrapper around the Prisma ORM that provides methods to query the database using Prisma.
 */
class _InsertionService {
  /**
   * Prisma ORM client instance
   */
  private prisma: PrismaClient = new PrismaClient();

  constructor() {}
  /**
   * Inserts data into the specified table using upsert.
   * @param query - A Query object containing the table name and data to insert.
   * @returns A Promise that resolves when the data has been inserted.
   */
  public async upsert(query: Query): Promise<void> {
    if (!query.data.length) return;
    this._handlePrismaPromises(await this._upsert(query), query);
  }
  public async delete({ table, ids }: Delete): Promise<void> {
    try {
      await this._delete(table, ids);
    } catch {}
  }
  private async _delete(
    table: Tables,
    ids: Buffer[]
  ): Promise<Prisma.BatchPayload> {
    switch (table) {
      case 'sales':
        return await this.prisma.sales.deleteMany({
          where: {
            id: {
              in: ids,
            },
          },
        });
      case 'asks':
        return await this.prisma.asks.deleteMany({
          where: {
            id: {
              in: ids,
            },
          },
        });
      default:
        throw new Error(`Unsupported Table: ${table}`);
    }
  }
  private async _upsert({
    table,
    data,
  }: Query): Promise<PromiseSettledResult<unknown>[]> {
    switch (table) {
      case 'sales':
        return await Promise.allSettled(
          (data as Prisma.salesCreateInput[]).map((sale) => {
            return this.prisma.sales.upsert({
              where: { id: sale.id },
              update: sale,
              create: sale,
            });
          })
        );
      case 'asks':
        return await Promise.allSettled(
          (data as Prisma.salesCreateInput[]).map((ask) => {
            return this.prisma.asks.upsert({
              where: { id: ask.id },
              update: ask,
              create: ask,
            });
          })
        );
      default:
        throw new Error(`Unsupported Table: ${table}`);
    }
  }
  private async _count(table: Tables): Promise<{ _count: number }> {
    try {
      switch (table) {
        case 'sales':
          return await this.prisma.sales.aggregate({
            _count: true,
          });
        case 'asks':
          return await this.prisma.asks.aggregate({
            _count: true,
          });
        default:
          throw new Error(`Unsupported Table: ${table}`);
      }
    } catch (err) {
      return { _count: 0 };
    }
  }
  /**
   * Retrieves the status of a specific dataset.
   * @param table - The table name of the dataset to retrieve the status for.
   * @returns A Promise that resolves to the status of the dataset as a PrismaStatus object.
   */
  public async tableCount(table: Tables): Promise<number> {
    const { _count: count } = await this._count(table);
    return count;
  }

  /**
   * Handles the settled promises returned by the insert method.
   * @param promises - An array of settled promises.
   * @param data - An array of data objects to be inserted.
   * @param table - The table name for insertion.
   * @returns A Promise that resolves when the handling is complete.
   */
  private async _handlePrismaPromises(
    promises: PromiseSettledResult<unknown>[],
    { data, table }: Query
  ): Promise<void> {
    const [rejected, _] = promises.reduce(
      ([rejected, fulfilled], p, i) => {
        if (p.status === 'rejected') {
          console.log(p.reason);
          console.log(p.status);
          process.exit(1);
          return [rejected.concat(data[i].id), fulfilled];
        } else {
          return [rejected, fulfilled.concat(data[i].id)];
        }
      },
      [[], []] as [Buffer[], Buffer[]]
    );
  }
}

export const InsertionService = new _InsertionService();
