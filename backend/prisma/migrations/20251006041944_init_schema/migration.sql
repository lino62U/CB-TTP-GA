/*
  Warnings:

  - You are about to drop the column `classroom_type` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `course_code` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `course_name` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `professor_id` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `student_count` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `course_id` on the `CoursePrerequisite` table. All the data in the column will be lost.
  - You are about to drop the column `day_of_week` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the `Curriculum` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semi_hours` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_hours` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_code` to the `CoursePrerequisite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Course" DROP CONSTRAINT "Course_professor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."CoursePrerequisite" DROP CONSTRAINT "CoursePrerequisite_course_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Curriculum" DROP CONSTRAINT "Curriculum_course_id_fkey";

-- DropIndex
DROP INDEX "public"."Course_course_code_key";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "classroom_type",
DROP COLUMN "course_code",
DROP COLUMN "course_name",
DROP COLUMN "professor_id",
DROP COLUMN "student_count",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "department2" TEXT,
ADD COLUMN     "department3" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "semester" TEXT NOT NULL,
ADD COLUMN     "semi_hours" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_hours" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL,
ALTER COLUMN "theory_hours" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "practice_hours" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "lab_hours" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "CoursePrerequisite" DROP COLUMN "course_id",
ADD COLUMN     "course_code" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "day_of_week",
DROP COLUMN "end_time",
DROP COLUMN "start_time",
ADD COLUMN     "class_type" VARCHAR(10),
ADD COLUMN     "max_students" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "semester" VARCHAR(10) NOT NULL,
ADD COLUMN     "status" VARCHAR(20),
ADD COLUMN     "year" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."Curriculum";

-- CreateTable
CREATE TABLE "ProfessorCourse" (
    "professorId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "ProfessorCourse_pkey" PRIMARY KEY ("professorId","courseId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- AddForeignKey
ALTER TABLE "ProfessorCourse" ADD CONSTRAINT "ProfessorCourse_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorCourse" ADD CONSTRAINT "ProfessorCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_course_code_fkey" FOREIGN KEY ("course_code") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
