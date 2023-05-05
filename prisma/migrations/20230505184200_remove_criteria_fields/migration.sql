/*
  Warnings:

  - You are about to drop the column `criteria_data_collection_id` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_collection_image` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_collection_name` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_token_image` on the `asks` table. All the data in the column will be lost.
  - You are about to drop the column `criteria_data_token_name` on the `asks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "asks" DROP COLUMN "criteria_data_collection_id",
DROP COLUMN "criteria_data_collection_image",
DROP COLUMN "criteria_data_collection_name",
DROP COLUMN "criteria_data_token_image",
DROP COLUMN "criteria_data_token_name";
