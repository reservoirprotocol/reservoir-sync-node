-- CreateTable
CREATE TABLE "transfers" (
    "id" BYTEA NOT NULL,
    "token_contract" BYTEA,
    "token_id" TEXT,
    "from" BYTEA,
    "to" BYTEA,
    "amount" TEXT,
    "block" INTEGER,
    "tx_hash" BYTEA,
    "log_index" INTEGER,
    "batch_index" INTEGER,
    "timestamp" INTEGER,
    "created_at" TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);
