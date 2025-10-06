/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Professor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Professor_name_key" ON "Professor"("name");
