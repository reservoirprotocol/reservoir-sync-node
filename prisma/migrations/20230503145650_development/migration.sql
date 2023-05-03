/*
  Warnings:

  - You are about to drop the column `valid_from` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `valid_until` on the `asks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "asks" DROP COLUMN "valid_from",
DROP COLUMN "valid_until";
