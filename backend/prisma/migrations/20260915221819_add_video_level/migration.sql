-- CreateEnum
CREATE TYPE "VideoLevel" AS ENUM ('principiante', 'intermedio', 'experto');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "level" "VideoLevel" NOT NULL DEFAULT 'principiante';
