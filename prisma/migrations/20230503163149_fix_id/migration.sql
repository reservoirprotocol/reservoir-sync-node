/*
  Warnings:

  - The primary key for the `asks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `bids` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ask_id` on the `bids` table. All the data in the column will be lost.
  - Changed the type of `id` on the `asks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `bids` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "asks_id_key";

-- DropIndex
DROP INDEX "bids_id_key";

-- AlterTable
ALTER TABLE "asks" DROP CONSTRAINT "asks_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BYTEA NOT NULL,
ADD CONSTRAINT "asks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "bids" DROP CONSTRAINT "bids_pkey",
DROP COLUMN "ask_id",
ADD COLUMN     "bid_id" BYTEA,
DROP COLUMN "id",
ADD COLUMN     "id" BYTEA NOT NULL,
ADD CONSTRAINT "bids_pkey" PRIMARY KEY ("id");
