/*
  Warnings:

  - The primary key for the `asks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `criteria_data_collection_id` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_collection_image` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_collection_name` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_token_image` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_token_name` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_token_tokenId` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `price_net_decimal` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `price_net_native` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `price_net_raw` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `price_net_usd` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `token_set_Id` on the `asks` table. All the data in the column will be lost.
  - You are about to alter the column `price_amount_decimal` on the `asks` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `DoublePrecision`.
  - You are about to alter the column `price_amount_usd` on the `asks` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `DoublePrecision`.
  - You are about to alter the column `price_amount_native` on the `asks` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `DoublePrecision`.
  - The `expiration` column on the `asks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `bids` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `criteria_data_collection_id` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_collection_image` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_collection_name` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_token_image` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_token_name` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_token_tokenId` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `price_net_decimal` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `price_net_native` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `price_net_raw` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `price_net_usd` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `token_set_Id` on the `bids` table. All the data in the column will be lost.
  - You are about to alter the column `price_amount_decimal` on the `bids` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `DoublePrecision`.
  - You are about to alter the column `price_amount_usd` on the `bids` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `DoublePrecision`.
  - You are about to alter the column `price_amount_native` on the `bids` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `DoublePrecision`.
  - A unique constraint covering the columns `[id]` on the table `asks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `bids` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "asks" DROP CONSTRAINT "asks_pkey",
DROP COLUMN "criteria_data_collection_id",
DROP COLUMN "criteria_data_collection_image",
DROP COLUMN "criteria_data_collection_name",
DROP COLUMN "criteria_data_token_image",
DROP COLUMN "criteria_data_token_name",
DROP COLUMN "criteria_data_token_tokenId",
DROP COLUMN "price_net_decimal",
DROP COLUMN "price_net_native",
DROP COLUMN "price_net_raw",
DROP COLUMN "price_net_usd",
DROP COLUMN "token_set_Id",
ADD COLUMN     "criteria_data_token_token_id" TEXT,
ADD COLUMN     "price_net_amount_decimal" DOUBLE PRECISION,
ADD COLUMN     "price_net_amount_native" DOUBLE PRECISION,
ADD COLUMN     "price_net_amount_raw" TEXT,
ADD COLUMN     "price_net_amount_usd" DOUBLE PRECISION,
ADD COLUMN     "token_set_id" TEXT,
ADD COLUMN     "valid_from" INTEGER,
ADD COLUMN     "valid_until" INTEGER,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "price_amount_decimal" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "price_amount_usd" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "price_amount_native" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "dynamic_pricing" SET DATA TYPE TEXT,
ALTER COLUMN "source_id" SET DATA TYPE TEXT,
ALTER COLUMN "fee_breakdown" SET DATA TYPE TEXT,
DROP COLUMN "expiration",
ADD COLUMN     "expiration" INTEGER,
ALTER COLUMN "updated_at" DROP DEFAULT,
ADD CONSTRAINT "asks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "bids" DROP CONSTRAINT "bids_pkey",
DROP COLUMN "criteria_data_collection_id",
DROP COLUMN "criteria_data_collection_image",
DROP COLUMN "criteria_data_collection_name",
DROP COLUMN "criteria_data_token_image",
DROP COLUMN "criteria_data_token_name",
DROP COLUMN "criteria_data_token_tokenId",
DROP COLUMN "price_net_decimal",
DROP COLUMN "price_net_native",
DROP COLUMN "price_net_raw",
DROP COLUMN "price_net_usd",
DROP COLUMN "token_set_Id",
ADD COLUMN     "ask_id" BYTEA,
ADD COLUMN     "criteria_data_token_token_id" TEXT,
ADD COLUMN     "price_net_amount_decimal" DOUBLE PRECISION,
ADD COLUMN     "price_net_amount_native" DOUBLE PRECISION,
ADD COLUMN     "price_net_amount_raw" TEXT,
ADD COLUMN     "price_net_amount_usd" DOUBLE PRECISION,
ADD COLUMN     "token_set_id" TEXT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "price_amount_decimal" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "price_amount_usd" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "price_amount_native" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "dynamic_pricing" SET DATA TYPE TEXT,
ALTER COLUMN "source_id" SET DATA TYPE TEXT,
ALTER COLUMN "fee_breakdown" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT,
ADD CONSTRAINT "bids_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "asks_id_key" ON "asks"("id");

-- CreateIndex
CREATE UNIQUE INDEX "bids_id_key" ON "bids"("id");
