/*
  Warnings:

  - You are about to drop the column `ask_id` on the `bids` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bids" DROP COLUMN "ask_id",
ADD COLUMN     "bid_id" BYTEA;
