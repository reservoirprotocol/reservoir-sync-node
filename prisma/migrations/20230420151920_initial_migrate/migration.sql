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
    "block" INTEGER,
    "tx_hash" BYTEA,
    "log_index" INTEGER,
    "batch_index" INTEGER,
    "timestamp" INTEGER,
    "wash_trading_score" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3),
    "price_currency_contract" BYTEA,
    "price_currency_name" TEXT,
    "price_currency_symbol" TEXT,
    "price_currency_decimals" INTEGER,
    "price_amount_raw" TEXT,
    "price_amount_decimal" DECIMAL,
    "price_amount_usd" DECIMAL,
    "price_amount_native" DECIMAL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BYTEA NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);
