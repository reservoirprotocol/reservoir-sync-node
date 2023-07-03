/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Prisma, PrismaClient } from '@prisma/client';
import { addressToBuffer, toBuffer } from '../utils';
import {
  AsksSchema,
  DataSets,
  DataTypes,
  InsertionServiceConfig,
  SalesSchema,
} from '../types';
import { LoggerService } from './LoggerService';

const FORMAT_METHODS = {
  sales: (rawSales: SalesSchema[]): Prisma.salesCreateInput[] => {
    return rawSales.map((sale: SalesSchema) => {
      return {
        id: Buffer.from(`${sale.txHash}-${sale.logIndex}-${sale.batchIndex}`),
        sale_id: toBuffer(sale.saleId),
        token_id: sale.token.tokenId,
        contract_id: addressToBuffer(sale.token.contract),
        order_id: addressToBuffer(sale.orderId),
        order_source: sale.orderSource,
        order_side: sale.orderSide,
        order_kind: sale.orderKind,
        amount: sale.amount,
        from: addressToBuffer(sale.from),
        to: addressToBuffer(sale.to),
        fill_source: sale.fillSource,
        block: sale.block,
        tx_hash: addressToBuffer(sale.txHash),
        log_index: sale.logIndex,
        batch_index: sale.batchIndex,
        timestamp: sale.timestamp,
        wash_trading_score: sale.washTradingScore,
        created_at: sale.createdAt,
        price_currency_contract: addressToBuffer(sale.price.currency.contract),
        updated_at: sale.updatedAt,
        price_currency_name: sale.price.currency.name,
        price_currency_symbol: sale.price.currency.symbol,
        price_currency_decimals: sale.price.currency.decimals,
        price_amount_raw: sale.price.amount.raw,
        price_amount_decimal: sale.price.amount.decimal,
        price_amount_usd: sale.price.amount.usd,
        price_amount_native: sale.price.amount.native,
        isDeleted: sale.isDeleted,
      };
    });
  },
  asks: (asks: AsksSchema[]): Prisma.asksCreateInput[] => {
    return asks.map((ask: AsksSchema) => {
      return {
        id: Buffer.from(
          `${ask?.id}-${ask?.contract}-${ask?.maker}-${ask?.tokenSetId}-${ask?.createdAt}`
        ),
        ask_id: ask?.id ? addressToBuffer(ask.id) : null,
        kind: ask?.kind || null,
        side: ask?.side || null,
        status: ask?.status || null,
        token_set_id: ask?.tokenSetId || null,
        token_set_schema_hash: ask?.tokenSetSchemaHash
          ? addressToBuffer(ask.tokenSetSchemaHash)
          : null,
        contract: ask?.contract ? addressToBuffer(ask.contract) : null,
        maker: ask?.maker ? addressToBuffer(ask.maker) : null,
        taker: ask?.taker ? addressToBuffer(ask.taker) : null,
        price_currency_contract: ask?.price?.currency?.contract
          ? addressToBuffer(ask.price.currency.contract)
          : null,
        price_currency_name: ask?.price?.currency?.name || null,
        price_currency_symbol: ask?.price?.currency?.symbol || null,
        price_currency_decimals: ask?.price?.currency?.decimals || null,
        price_amount_raw: ask?.price?.amount?.raw || null,
        price_amount_decimal: ask?.price?.amount?.decimal || null,
        price_amount_native: ask?.price?.amount?.native || null,
        price_amount_usd: ask?.price?.amount?.usd || null,
        price_net_amount_decimal: ask?.price?.netAmount?.decimal || null,
        price_net_amount_native: ask?.price?.netAmount?.native || null,
        price_net_amount_raw: ask?.price?.netAmount?.raw || null,
        price_net_amount_usd: ask?.price?.netAmount?.usd || null,
        valid_from: ask?.validFrom || null,
        valid_until: ask?.validUntil || null,
        quantity_filled: ask?.quantityFilled || null,
        quantity_remaining: ask?.quantityRemaining || null,
        criteria_kind: ask?.criteria?.kind || null,
        criteria_data_token_token_id:
          ask?.criteria?.data?.token?.tokenId || null,
        source_domain: ask?.source?.domain || null,
        source_icon: ask?.source?.icon || null,
        source_url: ask?.source?.url || null,
        source_id: ask?.source?.id || null,
        fee_bps: ask?.feeBps || null,
        fee_breakdown: JSON.stringify(ask.feeBreakdown),
        expiration: ask?.expiration || null,
        is_reservoir: ask?.isReservoir || null,
        is_dynamic: ask?.isDynamic || null,
        updated_at: ask?.updatedAt || null,
        created_at: ask?.createdAt || null,
      };
    });
  },
} as const;

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
    LoggerService.info(`Launched Insertion Service`);
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
