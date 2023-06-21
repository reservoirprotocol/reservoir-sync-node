/* eslint-disable no-unexpected-multiline */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { InsertionService } from '../services';
import { GraphQlServiceConfig, Schemas } from '../types';

/**
 * The _GraphQlService class provides methods for constructing GraphQL schemas.
 */
class _GraphQlService {
  /**
   * Collection of GraphQL schemas.
   * @access private
   * @type {Schemas}
   */
  private _schemas: any = {};

  /**
   * Constructs the GraphQL schemas based on the provided configuration.
   * @param {GraphQlServiceConfig} config - Configuration for the GraphQL service.
   * @returns {void}
   */
  public construct(config: GraphQlServiceConfig): void {
    config.mappings.forEach(({ datasets, table }) => {
      this._schemas[table] = new GraphQLSchema({
        query: new GraphQLObjectType({
          name: 'Query',
          fields: {
            ...(datasets.includes('sales') && {
              sale: {
                type: new GraphQLList(
                  new GraphQLObjectType({
                    name: 'Sale',
                    fields: {
                      block: {
                        type: GraphQLInt,
                        resolve: (parents): number => {
                          return parents.block;
                        },
                      },
                      fill_source: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return parents.fill_source;
                        },
                      },
                      sale_id: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return '0x' + parents.sale_id.toString('hex');
                        },
                      },
                      updated_at: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return new Date(parents.updated_at).toISOString();
                        },
                      },
                      created_at: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return new Date(parents.created_at).toISOString();
                        },
                      },
                      order_source: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return parents.order_source;
                        },
                      },
                      token_id: {
                        type: GraphQLInt,
                        resolve: (parents): number => {
                          return parents.token_id;
                        },
                      },
                      contract_id: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return '0x' + parents.contract_id.toString('hex');
                        },
                      },
                      tx_hash: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return '0x' + parents.tx_hash.toString('hex');
                        },
                      },
                    },
                  })
                ),
                args: { offset: { type: GraphQLInt } },
                resolve: (parent, args) => {
                  // @ts-ignore Prisma doesn't support model reference by variable name.
                  // See https://github.com/prisma/prisma/discussions/16058#discussioncomment-54936
                  return InsertionService.getClient()
                    [table].findMany({
                      skip: args.offset || 0,
                      take: 1000,
                    })
                    .then((sales: unknown) => sales);
                },
              },
            }),
            ...(datasets.includes('asks') && {
              ask: {
                type: new GraphQLList(
                  new GraphQLObjectType({
                    name: 'Ask',
                    fields: {
                      id: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return '0x' + parents.id.toString('hex');
                        },
                      },
                      ask_id: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return parents.ask_id
                            ? '0x' + parents.ask_id.toString('hex')
                            : '';
                        },
                      },
                      kind: {
                        type: GraphQLString,
                        resolve: (parents): string | null => parents.kind,
                      },
                      side: {
                        type: GraphQLString,
                        resolve: (parents): string | null => parents.side,
                      },
                      status: {
                        type: GraphQLString,
                        resolve: (parents): string | null => parents.status,
                      },
                      token_set_id: {
                        type: GraphQLString,
                        resolve: (parents): string | null =>
                          parents.token_set_id,
                      },
                      token_set_schema_hash: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return parents.token_set_schema_hash
                            ? '0x' +
                                parents.token_set_schema_hash.toString('hex')
                            : '';
                        },
                      },
                      contract: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return parents.contract
                            ? '0x' + parents.contract.toString('hex')
                            : '';
                        },
                      },
                      maker: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return parents.maker
                            ? '0x' + parents.maker.toString('hex')
                            : '';
                        },
                      },
                      taker: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return parents.taker
                            ? '0x' + parents.taker.toString('hex')
                            : '';
                        },
                      },
                      price_currency_contract: {
                        type: GraphQLString,
                        resolve: (parents): string => {
                          return parents.price_currency_contract
                            ? '0x' +
                                parents.price_currency_contract.toString('hex')
                            : '';
                        },
                      },
                      price_currency_name: {
                        type: GraphQLString,
                        resolve: (parents): string | null =>
                          parents.price_currency_name,
                      },
                      price_currency_symbol: {
                        type: GraphQLString,
                        resolve: (parents): string | null =>
                          parents.price_currency_symbol,
                      },
                      price_currency_decimals: {
                        type: GraphQLInt,
                        resolve: (parents): number | null =>
                          parents.price_currency_decimals,
                      },

                      price_amount_raw: {
                        type: GraphQLString,
                        resolve: (parents): string | null =>
                          parents.price_amount_raw,
                      },
                      price_amount_decimal: {
                        type: GraphQLFloat,
                        resolve: (parents): number | null =>
                          parents.price_amount_decimal,
                      },
                      price_amount_usd: {
                        type: GraphQLFloat,
                        resolve: (parents): number | null =>
                          parents.price_amount_usd,
                      },
                      price_amount_native: {
                        type: GraphQLFloat,
                        resolve: (parents): number | null =>
                          parents.price_amount_native,
                      },

                      valid_from: {
                        type: GraphQLString,
                        resolve: (parents): string =>
                          new Date(parents.valid_from).toISOString(),
                      },
                      valid_until: {
                        type: GraphQLString,
                        resolve: (parents): string =>
                          new Date(parents.valid_until).toISOString(),
                      },

                      criteria_kind: {
                        type: GraphQLString,
                        resolve: (parents): string | null =>
                          parents.criteria_kind,
                      },
                      criteria_data_token_token_id: {
                        type: GraphQLString,
                        resolve: (parents): string | null =>
                          parents.criteria_data_token_token_id,
                      },
                      source_id: {
                        type: GraphQLString,
                        resolve: (parents): string | null => parents.source_id,
                      },
                      fee_bps: {
                        type: GraphQLString,
                        resolve: (parents): string =>
                          parents.fee_bps.toString(),
                      },
                      expiration: {
                        type: GraphQLString,
                        resolve: (parents): string =>
                          new Date(parents.expiration).toISOString(),
                      },
                      is_reservoir: {
                        type: GraphQLBoolean,
                        resolve: (parents): boolean | null =>
                          parents.is_reservoir,
                      },
                      is_dynamic: {
                        type: GraphQLBoolean,
                        resolve: (parents): boolean | null =>
                          parents.is_dynamic,
                      },
                      created_at: {
                        type: GraphQLString,
                        resolve: (parents): string =>
                          new Date(parents.created_at).toISOString(),
                      },
                      updated_at: {
                        type: GraphQLString,
                        resolve: (parents): string =>
                          new Date(parents.updated_at).toISOString(),
                      },
                    },
                  })
                ),
                args: { offset: { type: GraphQLInt } },
                resolve: (parent, args) => {
                  // @ts-ignore Prisma doesn't support model reference by variable name.
                  // See https://github.com/prisma/prisma/discussions/16058#discussioncomment-54936
                  return InsertionService.getClient()
                    [table].findMany({
                      skip: args.offset || 0,
                      take: 1000,
                    })
                    .then((asks: unknown) => asks);
                },
              },
            }),
          },
        }),
      });
    });
  }

  /**
   * Returns the collection of GraphQL schemas.
   * @returns {Schemas} The schemas.
   */
  public getSchema(): Schemas {
    return this._schemas;
  }
}

/**
 * The GraphQlService object is an instance of the _GraphQlService class,
 * allowing for singleton-like usage throughout the application.
 */
export const GraphQlService = new _GraphQlService();
