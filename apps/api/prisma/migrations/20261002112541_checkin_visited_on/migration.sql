-- AlterTable
ALTER TABLE "check_ins" ADD COLUMN "visitedOn" DATE NOT NULL;

-- DropIndex
DROP INDEX "check_ins_userId_cafeId_createdAt_key";

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_userId_cafeId_visitedOn_key" ON "check_ins"("userId", "cafeId", "visitedOn");

-- CreateIndex
CREATE INDEX "check_ins_userId_createdAt_idx" ON "check_ins"("userId", "createdAt");
