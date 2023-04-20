import { PrismaClient, sales } from '@prisma/client';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
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
    },
  }),
});

export default schema;
