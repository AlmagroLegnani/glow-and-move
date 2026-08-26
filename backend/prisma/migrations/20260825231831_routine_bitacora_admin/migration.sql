/*
  Warnings:

  - You are about to drop the `TrainingProgress` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "BillingMode" AS ENUM ('trimestral', 'semestral', 'anual');

-- CreateEnum
CREATE TYPE "BlockStatus" AS ENUM ('locked', 'scheduled', 'active', 'completed');

-- DropForeignKey
ALTER TABLE "TrainingProgress" DROP CONSTRAINT "TrainingProgress_subscriptionId_fkey";

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "hasPersonalizedRoutine" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "billingMode" "BillingMode" NOT NULL DEFAULT 'trimestral';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "defaultReps" INTEGER,
ADD COLUMN     "defaultSets" INTEGER,
ADD COLUMN     "defaultWeight" DECIMAL(6,2);

-- DropTable
DROP TABLE "TrainingProgress";

-- CreateTable
CREATE TABLE "Block" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "description" TEXT,
    "durationWeeks" INTEGER NOT NULL DEFAULT 12,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockProgress" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "blockId" INTEGER NOT NULL,
    "status" "BlockStatus" NOT NULL DEFAULT 'locked',
    "currentWeek" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3),
    "paidUntil" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" SERIAL NOT NULL,
    "blockId" INTEGER NOT NULL,
    "userId" INTEGER,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineDay" (
    "id" SERIAL NOT NULL,
    "routineId" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoutineDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineExercise" (
    "id" SERIAL NOT NULL,
    "routineDayId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "suggestedSets" INTEGER NOT NULL,
    "suggestedReps" INTEGER NOT NULL,
    "suggestedWeight" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "RoutineExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayExecution" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "blockProgressId" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "performed" BOOLEAN NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseLog" (
    "id" SERIAL NOT NULL,
    "dayExecutionId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "suggestedSets" INTEGER NOT NULL,
    "suggestedReps" INTEGER NOT NULL,
    "suggestedWeight" DECIMAL(6,2) NOT NULL,
    "actualReps" INTEGER,
    "actualWeight" DECIMAL(6,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Block_number_key" ON "Block"("number");

-- CreateIndex
CREATE UNIQUE INDEX "BlockProgress_subscriptionId_blockId_key" ON "BlockProgress"("subscriptionId", "blockId");

-- CreateIndex
CREATE INDEX "Routine_blockId_userId_idx" ON "Routine"("blockId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineDay_routineId_dayNumber_key" ON "RoutineDay"("routineId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineExercise_routineDayId_videoId_key" ON "RoutineExercise"("routineDayId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "DayExecution_blockProgressId_weekNumber_dayNumber_key" ON "DayExecution"("blockProgressId", "weekNumber", "dayNumber");

-- AddForeignKey
ALTER TABLE "BlockProgress" ADD CONSTRAINT "BlockProgress_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockProgress" ADD CONSTRAINT "BlockProgress_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineDay" ADD CONSTRAINT "RoutineDay_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercise" ADD CONSTRAINT "RoutineExercise_routineDayId_fkey" FOREIGN KEY ("routineDayId") REFERENCES "RoutineDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercise" ADD CONSTRAINT "RoutineExercise_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayExecution" ADD CONSTRAINT "DayExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayExecution" ADD CONSTRAINT "DayExecution_blockProgressId_fkey" FOREIGN KEY ("blockProgressId") REFERENCES "BlockProgress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_dayExecutionId_fkey" FOREIGN KEY ("dayExecutionId") REFERENCES "DayExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
