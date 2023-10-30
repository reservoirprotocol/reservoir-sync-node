-- AlterTable
ALTER TABLE "asks" ADD COLUMN     "chain_id" TEXT;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "chain_id" TEXT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "chain_id" TEXT;

-- AlterTable
ALTER TABLE "transfers" ADD COLUMN     "chain_id" TEXT;
