import prisma from '@prisma/sdk';
import 'dotenv/config';
import fs from 'fs';

class PrismaSchemaGenerator {
  constructor(config) {
    this.config = config;
    this.schema = `
    datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }
      
      generator client {
        provider = "prisma-client-js"
      }

    `;
    this.modelShells = {
      sales: `
        id                 Bytes     @id @db.ByteA
        sale_id            Bytes?    @db.ByteA
        token_id           String?   @db.Text
        contract_id        Bytes?    @db.ByteA
        order_id           Bytes?    @db.ByteA
        order_source       String?   @db.Text
        order_side         String?   @db.Text
        order_kind         String?   @db.Text
        from               Bytes?    @db.ByteA
        to                 Bytes?    @db.ByteA
        amount             String?   @db.Text
        fill_source        String?   @db.Text
        block              Int?      @db.Integer
        tx_hash            Bytes?    @db.ByteA
        log_index          Int?      @db.Integer
        batch_index        Int?      @db.Integer
        timestamp          Int?      @db.Integer
        wash_trading_score Float?
        updated_at         DateTime? @default(now())
        created_at         DateTime?
      
        price_currency_contract Bytes?  @db.ByteA
        price_currency_name     String? @db.Text
        price_currency_symbol   String? @db.Text
        price_currency_decimals Int?    @db.Integer
      
        price_amount_raw     String?  @db.Text
        price_amount_decimal Decimal? @db.Decimal
        price_amount_usd     Decimal? @db.Decimal
        price_amount_native  Decimal? @db.Decimal
        `,
      orders: `
        id                      Bytes   @id @db.ByteA
        ask_id                  Bytes?  @db.ByteA
        kind                    String? @db.Text
        side                    String? @db.Text
        status                  String? @db.Text
        token_set_id            String? @db.Text
        token_set_schema_hash   Bytes?  @db.ByteA
        contract                Bytes?  @db.ByteA
        maker                   Bytes?  @db.ByteA
        taker                   Bytes?  @db.ByteA
        price_currency_contract Bytes?  @db.ByteA
        price_currency_name     String? @db.Text
        price_currency_symbol   String? @db.Text
        price_currency_decimals Int?    @db.Integer
      
        price_amount_raw     String?  @db.Text
        price_amount_decimal Decimal? @db.Decimal
        price_amount_usd     Decimal? @db.Decimal
        price_amount_native  Decimal? @db.Decimal
      
        price_net_amount_raw     String?  @db.Text
        price_net_amount_decimal Decimal? @db.Decimal
        price_net_amount_usd     Decimal? @db.Decimal
        price_net_amount_native  Decimal? @db.Decimal
      
        valid_from         BigInt?   @db.BigInt
        valid_until        BigInt?   @db.BigInt
        quantity_filled    BigInt?   @db.BigInt
        quantity_remaining BigInt?   @db.BigInt
      
        criteria_kind                String? @db.Text
        criteria_data_token_token_id String? @db.Text
      
        source_id     String? @db.Text
        source_domain String? @db.Text
        source_name   String? @db.Text
        source_icon   String? @db.Text
        source_url    String? @db.Text
        fee_bps       BigInt?   @db.BigInt
        fee_breakdown Json?     @db.JsonB
        expiration    BigInt?   @db.BigInt
        is_reservoir  Boolean?  @db.Boolean
        is_dynamic    Boolean?  @db.Boolean
        created_at    DateTime? @db.Timestamp
        updated_at    DateTime? @db.Timestamp
        `,
    };

    this.#createSchema();
    this.#writeSchema();
  }

  #createSchema() {
    for (const x of this.config) {
      if (
        (x.datasets.includes('sales') && x.datasets.includes('asks')) ||
        (x.datasets.includes('sales') && x.datasets.includes('bids'))
      )
        throw new Error(
          `SALES MODEL CANNOT BE LOCATED ON THE SAME TABLE AS ASKS/BIDS`
        );
      if (this.schema.includes(`model ${x.table}`))
        throw new Error(`UNIQUE TABLE NAMES ARE REQUIRED: ${x.table}`);

      this.schema += `${this.#createModel(
        x.table,
        x.datasets.includes('sales') ? 'sales' : 'orders'
      )}`;
    }
  }

  #createModel(name, model) {
    return `model ${name} {${this.modelShells[model]}}`;
  }

  #writeSchema() {
    prisma.formatSchema({ schema: this.schema }).then((schema) => {
      fs.writeFileSync(`./prisma/schema.prisma`, schema, 'utf-8');
    });
  }
}

new PrismaSchemaGenerator([
  {
    datasets: ['asks', 'bids'],
    table: 'all_orders',
  },
  {
    datasets: ['bids'],
    table: 'all_orders',
  },
  {
    datasets: ['sales'],
    table: 'sales',
  },
]);
