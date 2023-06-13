/*
  Warnings:

  - Made the column `db_created_at` on table `asks` required. This step will fail if there are existing NULL values in that column.
  - Made the column `db_updated_at` on table `asks` required. This step will fail if there are existing NULL values in that column.
  - Made the column `db_created_at` on table `sales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `db_updated_at` on table `sales` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "asks" ALTER COLUMN "db_created_at" SET NOT NULL,
ALTER COLUMN "db_created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "db_created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "db_updated_at" SET NOT NULL,
ALTER COLUMN "db_updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "sales" ALTER COLUMN "db_created_at" SET NOT NULL,
ALTER COLUMN "db_created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "db_created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "db_updated_at" SET NOT NULL,
ALTER COLUMN "db_updated_at" SET DATA TYPE TIMESTAMP(3);
