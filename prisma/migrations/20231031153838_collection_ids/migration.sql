-- AlterTable
ALTER TABLE "asks" ADD COLUMN     "collection_id" TEXT;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "collection_id" TEXT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "collection_id" TEXT;
