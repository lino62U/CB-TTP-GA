/*
  Warnings:

  - You are about to drop the column `course_code` on the `CoursePrerequisite` table. All the data in the column will be lost.
  - You are about to drop the column `professor_id` on the `ProfessorAvailability` table. All the data in the column will be lost.
  - The primary key for the `ProfessorCourse` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `professorId` on the `ProfessorCourse` table. All the data in the column will be lost.
  - You are about to drop the column `professor_id` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the `Professor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,time_slot_id]` on the table `ProfessorAvailability` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `course_id` to the `CoursePrerequisite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `ProfessorAvailability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ProfessorCourse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."CoursePrerequisite" DROP CONSTRAINT "CoursePrerequisite_course_code_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProfessorAvailability" DROP CONSTRAINT "ProfessorAvailability_professor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProfessorCourse" DROP CONSTRAINT "ProfessorCourse_professorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Schedule" DROP CONSTRAINT "Schedule_professor_id_fkey";

-- AlterTable
ALTER TABLE "CoursePrerequisite" DROP COLUMN "course_code",
ADD COLUMN     "course_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ProfessorAvailability" DROP COLUMN "professor_id",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ProfessorCourse" DROP CONSTRAINT "ProfessorCourse_pkey",
DROP COLUMN "professorId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "ProfessorCourse_pkey" PRIMARY KEY ("userId", "courseId");

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "professor_id",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."Professor";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'USER',
    "preferred_shift" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessorAvailability_user_id_time_slot_id_key" ON "ProfessorAvailability"("user_id", "time_slot_id");

-- AddForeignKey
ALTER TABLE "ProfessorAvailability" ADD CONSTRAINT "ProfessorAvailability_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorCourse" ADD CONSTRAINT "ProfessorCourse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
