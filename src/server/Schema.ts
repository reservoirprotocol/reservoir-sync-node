import { asks, PrismaClient, sales } from '@prisma/client';
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

const prisma = new PrismaClient();

/**
 * Construct a GraphQL schema and define the necessary resolvers.
 *
 * type Query {
 *   hello: String
 * }
 */
const SaleType = new GraphQLObjectType({
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
});
const AskType = new GraphQLObjectType({
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
        return parents.ask_id ? '0x' + parents.ask_id.toString('hex') : '';
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
          ? '0x' + parents.token_set_schema_hash.toString('hex')
          : '';
      },
    },
    contract: {
      type: GraphQLString,
      resolve: (parents): string => {
        return parents.contract ? '0x' + parents.contract.toString('hex') : '';
      },
    },
    maker: {
      type: GraphQLString,
      resolve: (parents): string => {
        return parents.maker ? '0x' + parents.maker.toString('hex') : '';
      },
    },
    taker: {
      type: GraphQLString,
      resolve: (parents): string => {
        return parents.taker ? '0x' + parents.taker.toString('hex') : '';
      },
    },
    price_currency_contract: {
      type: GraphQLString,
      resolve: (parents): string => {
        return parents.price_currency_contract
          ? '0x' + parents.price_currency_contract.toString('hex')
          : '';
      },
    },
    price_currency_name: {
      type: GraphQLString,
      resolve: (parents): string | null => parents.price_currency_name,
    },
    price_currency_symbol: {
      type: GraphQLString,
      resolve: (parents): string | null => parents.price_currency_symbol,
    },
    price_currency_decimals: {
      type: GraphQLInt,
      resolve: (parents): number | null => parents.price_currency_decimals,
    },

    price_amount_raw: {
      type: GraphQLString,
      resolve: (parents): string | null => parents.price_amount_raw,
    },
    price_amount_decimal: {
      type: GraphQLFloat,
      resolve: (parents): number | null => parents.price_amount_decimal,
    },
    price_amount_usd: {
      type: GraphQLFloat,
      resolve: (parents): number | null => parents.price_amount_usd,
    },
    price_amount_native: {
      type: GraphQLFloat,
      resolve: (parents): number | null => parents.price_amount_native,
    },

    valid_from: {
      type: GraphQLString,
      resolve: (parents): string => new Date(parents.valid_from).toISOString(),
    },
    valid_until: {
      type: GraphQLString,
      resolve: (parents): string => new Date(parents.valid_until).toISOString(),
    },

    criteria_kind: {
      type: GraphQLString,
      resolve: (parents): string | null => parents.criteria_kind,
    },
    criteria_data_token_token_id: {
      type: GraphQLString,
      resolve: (parents): string | null => parents.criteria_data_token_token_id,
    },
    criteria_data_token_name: {
      type: GraphQLString,
      resolve: (parents): string | null => parents.criteria_data_token_name,
    },
    criteria_data_token_image: {
      type: GraphQLString,
      resolve: (parents): string | null => parents.criteria_data_token_image,
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
      resolve: (parents): string => new Date(parents.expiration).toISOString(),
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
      resolve: (parents): string => new Date(parents.created_at).toISOString(),
    },
    updated_at: {
      type: GraphQLString,
      resolve: (parents): string => new Date(parents.updated_at).toISOString(),
    },
  },
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      sale: {
        type: new GraphQLList(SaleType),
        args: { offset: { type: GraphQLInt } },
        resolve: (parent, args): Promise<sales[]> => {
          return prisma.sales
            .findMany({
              skip: args.offset || 0,
              take: 1000,
            })
            .then((sales) => sales);
        },
      },
      ask: {
        type: new GraphQLList(AskType),
        args: { offset: { type: GraphQLInt } },
        resolve: (parent, args): Promise<asks[]> => {
          return prisma.asks.findMany({
            skip: args.offset || 0,
            take: 1000,
          });
        },
      },
    },
  }),
});

export default schema;
