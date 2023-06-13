-- AlterTable
ALTER TABLE "asks" ADD COLUMN     "db_created_at" TIMESTAMP,
ADD COLUMN     "db_updated_at" TIMESTAMP;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "db_created_at" TIMESTAMP,
ADD COLUMN     "db_updated_at" TIMESTAMP;
