/*
  Warnings:

  - You are about to drop the column `ask_id` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `dynamic_pricing` on the `asks` table. All the data in the column will be lost.
  - You are about to alter the column `price_amount_decimal` on the `asks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `price_amount_usd` on the `asks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `price_amount_native` on the `asks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - The `fee_breakdown` column on the `asks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `price_net_amount_decimal` on the `asks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `price_net_amount_native` on the `asks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to alter the column `price_net_amount_usd` on the `asks` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal`.
  - You are about to drop the `bids` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "asks" DROP COLUMN "ask_id",
DROP COLUMN "dynamic_pricing",
ADD COLUMN     "criteria_data_collection_id" TEXT,
ADD COLUMN     "criteria_data_collection_image" TEXT,
ADD COLUMN     "criteria_data_collection_name" TEXT,
ADD COLUMN     "criteria_data_token_image" TEXT,
ADD COLUMN     "criteria_data_token_name" TEXT,
ALTER COLUMN "price_amount_decimal" SET DATA TYPE DECIMAL,
ALTER COLUMN "price_amount_usd" SET DATA TYPE DECIMAL,
ALTER COLUMN "price_amount_native" SET DATA TYPE DECIMAL,
DROP COLUMN "fee_breakdown",
ADD COLUMN     "fee_breakdown" JSONB,
ALTER COLUMN "price_net_amount_decimal" SET DATA TYPE DECIMAL,
ALTER COLUMN "price_net_amount_native" SET DATA TYPE DECIMAL,
ALTER COLUMN "price_net_amount_usd" SET DATA TYPE DECIMAL;

-- DropTable
DROP TABLE "bids";
