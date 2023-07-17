/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Prisma, PrismaClient } from '@prisma/client';
import SyncNode from 'SyncNode';
import {
  AsksSchema,
  BidsSchema,
  DataSets,
  DataTypes,
  SalesSchema,
} from '../types';
import { addressToBuffer, toBuffer } from '../utils';
import { LoggerService } from './LoggerService';

interface DataSchemas {
  sales: SalesSchema;
  asks: AsksSchema;
  bids: BidsSchema;
}

interface DataReturns {
  sales: Prisma.salesCreateInput;
  asks: Prisma.asksCreateInput;
  bids: Prisma.bidsCreateInput;
}
/**
 *
 *
 * The _InsertionService class provides an interface to the Prisma ORM.
 * This service handles database connections, data upserts, and record counting.
 */
class _InsertionServivce {
  /**
   * Prisma ORM instance
   * @access private
   * @type {PrismaClient}
   */
  private _prisma: PrismaClient = new PrismaClient({
    datasources: {
      db: { url: `${process.env.DATABASE_URL}?pool_timeout=0` },
    },
  });

  /**
   * Initiates the connection to the database through Prisma.
   * @returns {Promise<void>}
   */
  public async launch(): Promise<void> {
    await this._prisma.$connect();
    LoggerService.info(`Insertion Service Launched`);
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
  public async upsert(
    type: DataTypes,
    data: AsksSchema[] | SalesSchema[] | BidsSchema[]
  ): Promise<void> {
    data = this._filter(type, data);

    return this._handlePrismaPromises(
      await Promise.allSettled(
        data.map((set) => {
          // @ts-ignore Prisma doesn't support model reference by variable name.
          // See https://github.com/prisma/prisma/discussions/16058#discussioncomment-54936
          return this._prisma[type].upsert({
            where: { id: this._format(type, set).id },
            create: this._format(type, set),
            update: this._format(type, set),
          });
        })
      )
    );
  }
  /**
   * Filters the input data based on the available contracts.
   * @param {DataTypes} type - The type of the data ('asks', 'bids', 'sales').
   * @param {AsksSchema[] | SalesSchema[] | BidsSchema[]} data - The input data.
   * @returns {AsksSchema[] | SalesSchema[] | BidsSchema[]} - The filtered data.
   * @private
   */
  private _filter(
    type: DataTypes,
    data: AsksSchema[] | SalesSchema[] | BidsSchema[]
  ): AsksSchema[] | SalesSchema[] | BidsSchema[] {
    const contracts = SyncNode.getContracts();
    if (!contracts || contracts.length === 0) return data;

    switch (type) {
      case 'asks':
        return (data as AsksSchema[]).filter((set) =>
          contracts.includes(set.contract)
        );
      case 'bids':
        return (data as BidsSchema[]).filter((set) =>
          contracts.includes(set.contract)
        );
      case 'sales':
        return (data as SalesSchema[]).filter((set) =>
          contracts.includes(set.token.contract)
        );
      default:
        return data;
    }
  }

  private _format<T extends keyof DataSchemas>(
    type: T,
    data: DataSchemas[T]
  ): DataReturns[T] {
    if (type === 'asks') {
      const ask = data as AsksSchema;
      return {
        id: Buffer.from(
          `${ask?.id}-${ask?.contract}-${ask?.maker}-${ask?.tokenSetId}-${ask?.createdAt}`,
          'utf16le'
        ),
        kind: ask?.kind,
        side: ask?.side,
        status: ask?.status,
        token_set_id: ask?.tokenSetId,
        token_set_schema_hash: ask?.tokenSetSchemaHash
          ? addressToBuffer(ask.tokenSetSchemaHash)
          : null,
        contract: ask?.contract ? addressToBuffer(ask.contract) : null,
        maker: ask?.maker ? addressToBuffer(ask.maker) : null,
        taker: ask?.taker ? addressToBuffer(ask.taker) : null,
        price_currency_contract: ask?.price?.currency?.contract
          ? addressToBuffer(ask.price.currency.contract)
          : null,
        price_currency_name: ask?.price?.currency?.name,
        price_currency_symbol: ask?.price?.currency?.symbol,
        price_currency_decimals: ask?.price?.currency?.decimals,
        price_amount_raw: ask?.price?.amount?.raw,
        price_amount_decimal: ask?.price?.amount?.decimal,
        price_amount_native: ask?.price?.amount?.native,
        price_amount_usd: ask?.price?.amount?.usd,
        price_net_amount_decimal: ask?.price?.netAmount?.decimal,
        price_net_amount_native: ask?.price?.netAmount?.native,
        price_net_amount_raw: ask?.price?.netAmount?.raw,
        price_net_amount_usd: ask?.price?.netAmount?.usd,
        valid_from: ask?.validFrom,
        valid_until: ask?.validUntil,
        quantity_filled: ask?.quantityFilled,
        quantity_remaining: ask?.quantityRemaining,
        criteria_kind: ask?.criteria?.kind,
        criteria_data_token_token_id: ask?.criteria?.data?.token?.tokenId,
        source_domain: ask?.source?.domain,
        source_icon: ask?.source?.icon,
        source_url: ask?.source?.url,
        source_id: ask?.source?.id,
        fee_bps: ask?.feeBps,
        fee_breakdown: JSON.stringify(ask.feeBreakdown),
        expiration: ask?.expiration,
        is_reservoir: ask?.isReservoir,
        is_dynamic: ask?.isDynamic,
        updated_at: ask?.updatedAt,
        created_at: ask?.createdAt,
      };
    }

    if (type === 'bids') {
      const bid = data as BidsSchema;
      return {
        id: Buffer.from(
          `${bid?.id}-${bid?.contract}-${bid?.maker}-${bid?.tokenSetId}-${bid?.createdAt}`,
          'utf16le'
        ),
        kind: bid?.kind,
        side: bid?.side,
        status: bid?.status,
        token_set_id: bid?.tokenSetId,
        token_set_schema_hash: bid?.tokenSetSchemaHash
          ? addressToBuffer(bid.tokenSetSchemaHash)
          : null,
        contract: bid?.contract ? addressToBuffer(bid.contract) : null,
        maker: bid?.maker ? addressToBuffer(bid.maker) : null,
        taker: bid?.taker ? addressToBuffer(bid.taker) : null,
        price_currency_contract: bid?.price?.currency?.contract
          ? addressToBuffer(bid.price.currency.contract)
          : null,
        price_currency_name: bid?.price?.currency?.name,
        price_currency_symbol: bid?.price?.currency?.symbol,
        price_currency_decimals: bid?.price?.currency?.decimals,
        price_amount_raw: bid?.price?.amount?.raw,
        price_amount_decimal: bid?.price?.amount?.decimal,
        price_amount_native: bid?.price?.amount?.native,
        price_amount_usd: bid?.price?.amount?.usd,
        price_net_amount_decimal: bid?.price?.netAmount?.decimal,
        price_net_amount_native: bid?.price?.netAmount?.native,
        price_net_amount_raw: bid?.price?.netAmount?.raw,
        price_net_amount_usd: bid?.price?.netAmount?.usd,
        valid_from: bid?.validFrom,
        valid_until: bid?.validUntil,
        quantity_filled: bid?.quantityFilled,
        quantity_remaining: bid?.quantityRemaining,
        criteria_kind: bid?.criteria?.kind,
        criteria_data_token_token_id: bid?.criteria?.data?.token?.tokenId,
        source_domain: bid?.source?.domain,
        source_icon: bid?.source?.icon,
        source_url: bid?.source?.url,
        source_id: bid?.source?.id,
        fee_bps: bid?.feeBps,
        fee_breakdown: JSON.stringify(bid.feeBreakdown),
        expiration: bid?.expiration,
        is_reservoir: bid?.isReservoir,
        is_dynamic: bid?.isDynamic,
        updated_at: bid?.updatedAt,
        created_at: bid?.createdAt,
      };
    }

    if (type === 'sales') {
      const sale = data as SalesSchema;
      return {
        id: Buffer.from(`${sale.txHash}-${sale.logIndex}-${sale.batchIndex}`),
        sale_id: toBuffer(sale.saleId),
        token_id: sale.token?.tokenId,
        contract_id: addressToBuffer(sale.token?.contract),
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
        price_currency_contract: addressToBuffer(
          sale.price?.currency?.contract
        ),
        updated_at: sale.updatedAt,
        price_currency_name: sale.price?.currency?.name,
        price_currency_symbol: sale.price?.currency?.symbol,
        price_currency_decimals: sale.price?.currency?.decimals,
        price_amount_raw: sale.price?.amount?.raw,
        price_amount_decimal: sale.price?.amount?.decimal,
        price_amount_usd: sale.price?.amount?.usd,
        price_amount_native: sale.price?.amount?.native,
      };
    }

    throw new Error(`Unknown data type: ${type}`);
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
