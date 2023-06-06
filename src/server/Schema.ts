import { GraphQLSchema } from 'graphql';

interface GraphQlServiceConfig {
  datsets: string[];
  table: string;
}
class _GraphQlService {
  private config: GraphQlServiceConfig[] = [];
  private schema: GraphQLSchema | null = null;

  public construct(config: GraphQlServiceConfig[]) {
    this.config = config;

    this.config.forEach((set) => {
      const tableName = set.table;
      const referenceName = set.datsets.includes('sales')
        ? 'sales'
        : set.datsets.includes('asks') && set.datsets.includes('bids')
        ? 'orders'
        : set.datsets[0];

        
    });
  }

  public getSchema() {
    return this.schema;
  }
}

export const GraphQlService = new _GraphQlService();
