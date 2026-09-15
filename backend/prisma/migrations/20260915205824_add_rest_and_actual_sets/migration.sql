-- AlterTable
ALTER TABLE "ExerciseLog" ADD COLUMN     "actualRest" TEXT,
ADD COLUMN     "actualSets" INTEGER,
ADD COLUMN     "suggestedRest" TEXT;

-- AlterTable
ALTER TABLE "RoutineExercise" ADD COLUMN     "suggestedRest" TEXT;
