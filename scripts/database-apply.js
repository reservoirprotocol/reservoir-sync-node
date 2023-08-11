/* eslint-disable */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    // Create sales
    await prisma.$executeRaw`
-- CreateTable
CREATE TABLE "sales" (
    "id" BYTEA NOT NULL,
    "sale_id" BYTEA,
    "token_id" TEXT,
    "contract_id" BYTEA,
    "order_id" BYTEA,
    "order_source" TEXT,
    "order_side" TEXT,
    "order_kind" TEXT,
    "from" BYTEA,
    "to" BYTEA,
    "amount" TEXT,
    "fill_source" TEXT,
    "block" TEXT,
    "tx_hash" BYTEA,
    "log_index" TEXT,
    "batch_index" TEXT,
    "timestamp" TEXT,
    "wash_trading_score" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3),
    "price_currency_contract" BYTEA,
    "price_currency_name" TEXT,
    "price_currency_symbol" TEXT,
    "price_currency_decimals" TEXT,
    "price_amount_raw" TEXT,
    "price_amount_decimal" TEXT,
    "price_amount_usd" TEXT,
    "price_amount_native" TEXT,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

    `;

    // Create asks
    await prisma.$executeRaw`
    -- CreateTable
    CREATE TABLE "asks" (
    "id" BYTEA NOT NULL,
    "kind" TEXT,
    "side" TEXT,
    "status" TEXT,
    "token_set_id" TEXT,
    "token_set_schema_hash" BYTEA,
    "contract" BYTEA,
    "maker" BYTEA,
    "taker" BYTEA,
    "price_currency_contract" BYTEA,
    "price_currency_name" TEXT,
    "price_currency_symbol" TEXT,
    "price_currency_decimals" TEXT,
    "price_amount_raw" TEXT,
    "price_amount_decimal" TEXT,
    "price_amount_usd" TEXT,
    "price_amount_native" TEXT,
    "price_net_amount_raw" TEXT,
    "price_net_amount_decimal" TEXT,
    "price_net_amount_usd" TEXT,
    "price_net_amount_native" TEXT,
    "valid_from" TEXT,
    "valid_until" TEXT,
    "quantity_filled" TEXT,
    "quantity_remaining" TEXT,
    "criteria_kind" TEXT,
    "criteria_data_token_token_id" TEXT,
    "source_id" TEXT,
    "source_domain" TEXT,
    "source_name" TEXT,
    "source_icon" TEXT,
    "source_url" TEXT,
    "fee_bps" TEXT,
    "fee_breakdown" JSONB,
    "expiration" TEXT,
    "is_reservoir" BOOLEAN,
    "is_dynamic" BOOLEAN,
    "created_at" TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "asks_pkey" PRIMARY KEY ("id")
);

    `;

    // Create asks_active
    await prisma.$executeRaw`
-- CreateTable
CREATE TABLE "asks_active" (
    "id" BYTEA NOT NULL,
    "kind" TEXT,
    "side" TEXT,
    "status" TEXT,
    "token_set_id" TEXT,
    "token_set_schema_hash" BYTEA,
    "contract" BYTEA,
    "maker" BYTEA,
    "taker" BYTEA,
    "price_currency_contract" BYTEA,
    "price_currency_name" TEXT,
    "price_currency_symbol" TEXT,
    "price_currency_decimals" TEXT,
    "price_amount_raw" TEXT,
    "price_amount_decimal" TEXT,
    "price_amount_usd" TEXT,
    "price_amount_native" TEXT,
    "price_net_amount_raw" TEXT,
    "price_net_amount_decimal" TEXT,
    "price_net_amount_usd" TEXT,
    "price_net_amount_native" TEXT,
    "valid_from" TEXT,
    "valid_until" TEXT,
    "quantity_filled" TEXT,
    "quantity_remaining" TEXT,
    "criteria_kind" TEXT,
    "criteria_data_token_token_id" TEXT,
    "source_id" TEXT,
    "source_domain" TEXT,
    "source_name" TEXT,
    "source_icon" TEXT,
    "source_url" TEXT,
    "fee_bps" TEXT,
    "fee_breakdown" JSONB,
    "expiration" TEXT,
    "is_reservoir" BOOLEAN,
    "is_dynamic" BOOLEAN,
    "created_at" TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "asks_active_pkey" PRIMARY KEY ("id")
);
    `;

    // Create bids
    await prisma.$executeRaw`
-- CreateTable
CREATE TABLE "bids" (
    "id" BYTEA NOT NULL,
    "kind" TEXT,
    "side" TEXT,
    "status" TEXT,
    "token_set_id" TEXT,
    "token_set_schema_hash" BYTEA,
    "contract" BYTEA,
    "maker" BYTEA,
    "taker" BYTEA,
    "price_currency_contract" BYTEA,
    "price_currency_name" TEXT,
    "price_currency_symbol" TEXT,
    "price_currency_decimals" TEXT,
    "price_amount_raw" TEXT,
    "price_amount_decimal" TEXT,
    "price_amount_usd" TEXT,
    "price_amount_native" TEXT,
    "price_net_amount_raw" TEXT,
    "price_net_amount_decimal" TEXT,
    "price_net_amount_usd" TEXT,
    "price_net_amount_native" TEXT,
    "valid_from" TEXT,
    "valid_until" TEXT,
    "quantity_filled" TEXT,
    "quantity_remaining" TEXT,
    "criteria_kind" TEXT,
    "criteria_data_token_token_id" TEXT,
    "source_id" TEXT,
    "source_domain" TEXT,
    "source_name" TEXT,
    "source_icon" TEXT,
    "source_url" TEXT,
    "fee_bps" TEXT,
    "fee_breakdown" JSONB,
    "expiration" TEXT,
    "is_reservoir" BOOLEAN,
    "is_dynamic" BOOLEAN,
    "created_at" TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);
    `;

    // Create bids_active
    await prisma.$executeRaw`
-- CreateTable
CREATE TABLE "bids_active" (
        "id" BYTEA NOT NULL,
        "kind" TEXT,
        "side" TEXT,
        "status" TEXT,
        "token_set_id" TEXT,
        "token_set_schema_hash" BYTEA,
        "contract" BYTEA,
        "maker" BYTEA,
        "taker" BYTEA,
        "price_currency_contract" BYTEA,
        "price_currency_name" TEXT,
        "price_currency_symbol" TEXT,
        "price_currency_decimals" TEXT,
        "price_amount_raw" TEXT,
        "price_amount_decimal" TEXT,
        "price_amount_usd" TEXT,
        "price_amount_native" TEXT,
        "price_net_amount_raw" TEXT,
        "price_net_amount_decimal" TEXT,
        "price_net_amount_usd" TEXT,
        "price_net_amount_native" TEXT,
        "valid_from" TEXT,
        "valid_until" TEXT,
        "quantity_filled" TEXT,
        "quantity_remaining" TEXT,
        "criteria_kind" TEXT,
        "criteria_data_token_token_id" TEXT,
        "source_id" TEXT,
        "source_domain" TEXT,
        "source_name" TEXT,
        "source_icon" TEXT,
        "source_url" TEXT,
        "fee_bps" TEXT,
        "fee_breakdown" JSONB,
        "expiration" TEXT,
        "is_reservoir" BOOLEAN,
        "is_dynamic" BOOLEAN,
        "created_at" TIMESTAMP,
        "updated_at" TIMESTAMP,

    CONSTRAINT "bids_active_pkey" PRIMARY KEY ("id")
);
    `;

    // Create transfers
    await prisma.$executeRaw`
-- CreateTable
CREATE TABLE "transfers" (
    "id" BYTEA NOT NULL,
    "token_contract" BYTEA,
    "token_id" TEXT,
    "from" BYTEA,
    "to" BYTEA,
    "amount" TEXT,
    "block" TEXT,
    "tx_hash" BYTEA,
    "log_index" TEXT,
    "batch_index" TEXT,
    "timestamp" TEXT,
    "created_at" TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

    `;
  } catch (error) {
    console.log(error);
  } finally {
    await prisma.$disconnect();
  }
})();
