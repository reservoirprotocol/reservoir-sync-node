/* eslint-disable no-unexpected-multiline */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { PrismaClient } from "@prisma/client";
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";

/**
 * # toBuffer
 * @param hexValue - Hex value to slice
 * @returns Formatted buffer of a Hex
 */
export const toBuffer = (hexValue: string = "") => {
  if (!hexValue) return null;
  return Buffer.from(hexValue || " ", "hex");
};

export const toString = (value: number = 0): string | null => {
  if (!value) return null;
  return value.toString();
};

/**
 * # toBuffer
 * @param hexValue - Hex value to slice
 * @returns Formatted buffer of a Hex
 */
export const addressToBuffer = (hexValue: string = "") => {
  if (!hexValue) return null;
  return Buffer.from((hexValue || " ").slice(2), "hex");
};

/**
 * The _GraphQlService class provides methods for constructing GraphQL schemas.
 */
class _GraphQlService {
  /**
   * Collection of GraphQL schemas.
   * @access private
   * @type {Schemas}
   */
  private _schemas: Record<string | number, GraphQLSchema> = {};

  private _prisma: PrismaClient = new PrismaClient({
    datasources: {
      db: { url: `${process.env.DATABASE_URL}?pool_timeout=0` },
    },
  });

  constructor() {
    this._schemas["asks"] = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: "Query",
        fields: {
          ask: {
            type: new GraphQLList(
              new GraphQLObjectType({
                name: "Ask",
                fields: {
                  id: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return "0x" + parents.id.toString("hex");
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
                    resolve: (parents): string | null => parents.token_set_id,
                  },
                  token_set_schema_hash: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.token_set_schema_hash
                        ? "0x" + parents.token_set_schema_hash.toString("hex")
                        : "";
                    },
                  },
                  contract: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.contract
                        ? "0x" + parents.contract.toString("hex")
                        : "";
                    },
                  },
                  maker: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.maker
                        ? "0x" + parents.maker.toString("hex")
                        : "";
                    },
                  },
                  taker: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.taker
                        ? "0x" + parents.taker.toString("hex")
                        : "";
                    },
                  },
                  price_currency_contract: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.price_currency_contract
                        ? "0x" + parents.price_currency_contract.toString("hex")
                        : "";
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
                    resolve: (parents): string | null => parents.criteria_kind,
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
                    resolve: (parents): string => parents.fee_bps.toString(),
                  },
                  expiration: {
                    type: GraphQLString,
                    resolve: (parents): string =>
                      new Date(parents.expiration).toISOString(),
                  },
                  is_reservoir: {
                    type: GraphQLBoolean,
                    resolve: (parents): boolean | null => parents.is_reservoir,
                  },
                  is_dynamic: {
                    type: GraphQLBoolean,
                    resolve: (parents): boolean | null => parents.is_dynamic,
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
            args: {
              offset: { type: GraphQLInt },
              id: { type: GraphQLString },
              kind: { type: GraphQLString },
              status: { type: GraphQLString },
              token_set_id: { type: GraphQLString },
              valid_from: { type: GraphQLString },
              valid_until: { type: GraphQLString },
              criteria_kind: { type: GraphQLString },
              fee_bps: { type: GraphQLString },
              expiration: { type: GraphQLString },
              is_reservoir: { type: GraphQLBoolean },
              is_dynamic: { type: GraphQLBoolean },
            },
            resolve: (parent, args) => {
              return this._prisma.asks
                .findMany({
                  skip: args.offset || 0,
                  take: 1000,
                  where: {
                    ...(args.id && { id: toBuffer(args.id) }),
                    ...(args.kind && { kind: args.kind }),
                    ...(args.status && { status: args.status }),
                    ...(args.token_set_id && {
                      token_set_id: args.token_set_id,
                    }),
                    ...(args.valid_from && { valid_from: args.valid_from }),
                    ...(args.valid_until && { valid_until: args.valid_until }),
                    ...(args.criteria_kind && {
                      criteria_kind: args.criteria_kind,
                    }),
                    ...(args.fee_bps && { fee_bps: args.fee_bps }),
                    ...(args.expiration && { expiration: args.expiration }),
                    ...(args.is_reservoir !== undefined
                      ? { is_reservoir: args.is_reservoir }
                      : {}),
                    ...(args.is_dynamic !== undefined
                      ? { is_dynamic: args.is_dynamic }
                      : {}),
                  },
                })
                .then((asks: unknown) => asks);
            },
          },
        },
      }),
    });
    this._schemas["bids"] = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: "Query",
        fields: {
          bid: {
            type: new GraphQLList(
              new GraphQLObjectType({
                name: "Bid",
                fields: {
                  id: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return "0x" + parents.id.toString("hex");
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
                    resolve: (parents): string | null => parents.token_set_id,
                  },
                  token_set_schema_hash: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.token_set_schema_hash
                        ? "0x" + parents.token_set_schema_hash.toString("hex")
                        : "";
                    },
                  },
                  contract: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.contract
                        ? "0x" + parents.contract.toString("hex")
                        : "";
                    },
                  },
                  maker: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.maker
                        ? "0x" + parents.maker.toString("hex")
                        : "";
                    },
                  },
                  taker: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.taker
                        ? "0x" + parents.taker.toString("hex")
                        : "";
                    },
                  },
                  price_currency_contract: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.price_currency_contract
                        ? "0x" + parents.price_currency_contract.toString("hex")
                        : "";
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
                    resolve: (parents): string | null => parents.criteria_kind,
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
                    resolve: (parents): string => parents.fee_bps.toString(),
                  },
                  expiration: {
                    type: GraphQLString,
                    resolve: (parents): string =>
                      new Date(parents.expiration).toISOString(),
                  },
                  is_reservoir: {
                    type: GraphQLBoolean,
                    resolve: (parents): boolean | null => parents.is_reservoir,
                  },
                  is_dynamic: {
                    type: GraphQLBoolean,
                    resolve: (parents): boolean | null => parents.is_dynamic,
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
            args: {
              offset: { type: GraphQLInt },
              id: { type: GraphQLString },
              kind: { type: GraphQLString },
              status: { type: GraphQLString },
              token_set_id: { type: GraphQLString },
              valid_from: { type: GraphQLString },
              valid_until: { type: GraphQLString },
              criteria_kind: { type: GraphQLString },
              fee_bps: { type: GraphQLString },
              expiration: { type: GraphQLString },
              is_reservoir: { type: GraphQLBoolean },
              is_dynamic: { type: GraphQLBoolean },
            },
            resolve: (parent, args) => {
              return this._prisma.bids
                .findMany({
                  skip: args.offset || 0,
                  take: 1000,
                  where: {
                    ...(args.id && { id: toBuffer(args.id) }),
                    ...(args.kind && { kind: args.kind }),
                    ...(args.status && { status: args.status }),
                    ...(args.token_set_id && {
                      token_set_id: args.token_set_id,
                    }),
                    ...(args.valid_from && { valid_from: args.valid_from }),
                    ...(args.valid_until && { valid_until: args.valid_until }),
                    ...(args.criteria_kind && {
                      criteria_kind: args.criteria_kind,
                    }),
                    ...(args.fee_bps && { fee_bps: args.fee_bps }),
                    ...(args.expiration && { expiration: args.expiration }),
                    ...(args.is_reservoir !== undefined
                      ? { is_reservoir: args.is_reservoir }
                      : {}),
                    ...(args.is_dynamic !== undefined
                      ? { is_dynamic: args.is_dynamic }
                      : {}),
                  },
                })
                .then((bids: unknown) => bids);
            },
          },
        },
      }),
    });
    this._schemas["transfers"] = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: "Query",
        fields: {
          transfer: {
            type: new GraphQLList(
              new GraphQLObjectType({
                name: "Transfer",
                fields: {
                  id: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return "0x" + parents.id.toString("hex");
                    },
                  },
                  token_contract: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.token_contract
                        ? "0x" + parents.token_contract.toString("hex")
                        : "";
                    },
                  },
                  from: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.from
                        ? "0x" + parents.from.toString("hex")
                        : "";
                    },
                  },
                  to: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return parents.to
                        ? "0x" + parents.to.toString("hex")
                        : "";
                    },
                  },
                  amount: {
                    type: GraphQLString,
                    resolve: (parents): number => {
                      return parents.amount;
                    },
                  },
                  updated_at: {
                    type: GraphQLString,
                    resolve: (parents): string =>
                      new Date(parents.updated_at).toISOString(),
                  },
                },
              })
            ),
            args: {
              offset: { type: GraphQLInt },
              id: { type: GraphQLString },
              token_contract: { type: GraphQLString },
              from: { type: GraphQLString },
              to: { type: GraphQLString },
              amount: { type: GraphQLString },
              updated_at: { type: GraphQLString },
            },
            resolve: (parent, args) => {
              return this._prisma.asks
                .findMany({
                  skip: args.offset || 0,
                  take: 1000,
                  where: {
                    ...(args.id && {
                      id: toBuffer(args.id),
                    }),
                    ...(args.token_contract && {
                      token_contract: toBuffer(args.token_contract),
                    }),
                    ...(args.updated_at && {
                      updated_at: toBuffer(args.updated_at),
                    }),
                    ...(args.from && { from: args.from }),
                    ...(args.to && { block: args.to }),
                  },
                })
                .then((asks: unknown) => asks);
            },
          },
        },
      }),
    });
    this._schemas["sales"] = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: "Query",
        fields: {
          sale: {
            type: new GraphQLList(
              new GraphQLObjectType({
                name: "Sale",
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
                      return "0x" + parents.sale_id.toString("hex");
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
                      return "0x" + parents.contract_id.toString("hex");
                    },
                  },
                  tx_hash: {
                    type: GraphQLString,
                    resolve: (parents): string => {
                      return "0x" + parents.tx_hash.toString("hex");
                    },
                  },
                },
              })
            ),
            args: {
              offset: { type: GraphQLInt },
              contract_id: { type: GraphQLString },
              tx_hash: { type: GraphQLString },
              token_id: { type: GraphQLInt },
              order_source: { type: GraphQLString },
              created_at: { type: GraphQLString },
              updated_at: { type: GraphQLString },
              sale_id: { type: GraphQLString },
              fill_source: { type: GraphQLString },
              block: { type: GraphQLInt },
            },
            resolve: (parent, args) => {
              return this._prisma.sales
                .findMany({
                  skip: args.offset || 0,
                  where: {
                    ...(args.contract_id && {
                      contract_id: toBuffer(args.contract_id),
                    }),
                    ...(args.tx_hash && { tx_hash: toBuffer(args.tx_hash) }),
                    ...(args.token_id && { token_id: args.token_id }),
                    ...(args.created_at && { created_at: args.created_at }),
                    ...(args.sale_id && { sale_id: toBuffer(args.sale_id) }),
                    ...(args.fill_source && { fill_source: args.fill_source }),
                    ...(args.block && { block: args.block.toString() }),
                  },
                  take: 1000,
                })
                .then((sales: unknown) => sales)
                .catch((e) => console.log(e));
            },
          },
        },
      }),
    });
  }

  /**
   * Returns the collection of GraphQL schemas.
   * @returns {Record<string | number, GraphQLSchema>} The schemas.
   */
  public getSchema(): Record<string | number, GraphQLSchema> {
    return this._schemas;
  }
}

/**
 * The GraphQlService object is an instance of the _GraphQlService class,
 * allowing for singleton-like usage throughout the application.
 */
export const GraphQlService = new _GraphQlService();
