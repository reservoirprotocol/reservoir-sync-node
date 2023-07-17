/*
  Warnings:

  - You are about to drop the column `order_id` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `order_type` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `order_type` on the `bids` table. All the data in the column will be lost.
  - You are about to drop the column `order_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_type` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "asks" DROP COLUMN "order_id",
DROP COLUMN "order_type";

-- AlterTable
ALTER TABLE "bids" DROP COLUMN "order_id",
DROP COLUMN "order_type";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "order_id",
DROP COLUMN "order_type";
