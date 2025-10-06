/*
  Warnings:

  - You are about to drop the column `curriculum_name` on the `Curriculum` table. All the data in the column will be lost.
  - Added the required column `semester` to the `Curriculum` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Curriculum` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Curriculum" DROP COLUMN "curriculum_name",
ADD COLUMN     "semester" VARCHAR(2) NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;
