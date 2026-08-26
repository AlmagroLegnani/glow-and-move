-- DropIndex
DROP INDEX "BlockProgress_subscriptionId_blockId_key";

-- AlterTable
ALTER TABLE "BlockProgress" ADD COLUMN "cycle" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "BlockProgress_subscriptionId_blockId_cycle_key" ON "BlockProgress"("subscriptionId", "blockId", "cycle");
