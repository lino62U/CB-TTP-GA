-- CreateTable
CREATE TABLE "UniversityMetadata" (
    "id" SERIAL NOT NULL,
    "university_name" VARCHAR(150) NOT NULL,
    "school_name" VARCHAR(150) NOT NULL,
    "semester_code" VARCHAR(10) NOT NULL,
    "curriculum_name" VARCHAR(50) NOT NULL,
    "block_duration_min" INTEGER NOT NULL,
    "day_start_time" TIME NOT NULL,
    "day_end_time" TIME NOT NULL,

    CONSTRAINT "UniversityMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" SERIAL NOT NULL,
    "day_of_week" VARCHAR(3) NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" SERIAL NOT NULL,
    "room_code" VARCHAR(10) NOT NULL,
    "room_name" VARCHAR(100),
    "room_type" VARCHAR(10) NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professor" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "preferred_shift" VARCHAR(20),

    CONSTRAINT "Professor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessorAvailability" (
    "id" SERIAL NOT NULL,
    "professor_id" INTEGER NOT NULL,
    "time_slot_id" INTEGER NOT NULL,

    CONSTRAINT "ProfessorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "course_code" VARCHAR(20) NOT NULL,
    "course_name" VARCHAR(100) NOT NULL,
    "credits" INTEGER NOT NULL,
    "theory_hours" INTEGER NOT NULL,
    "practice_hours" INTEGER NOT NULL,
    "lab_hours" INTEGER NOT NULL,
    "student_count" INTEGER NOT NULL,
    "classroom_type" VARCHAR(10) NOT NULL,
    "professor_id" INTEGER,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePrerequisite" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "prerequisite_code" VARCHAR(20) NOT NULL,

    CONSTRAINT "CoursePrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curriculum" (
    "id" SERIAL NOT NULL,
    "curriculum_name" VARCHAR(100) NOT NULL,
    "course_id" INTEGER NOT NULL,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationWeight" (
    "id" SERIAL NOT NULL,
    "constraint_type" VARCHAR(20) NOT NULL,
    "constraint_name" VARCHAR(50) NOT NULL,
    "weight_value" INTEGER NOT NULL,

    CONSTRAINT "OptimizationWeight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_day_of_week_start_time_end_time_key" ON "TimeSlot"("day_of_week", "start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_room_code_key" ON "Classroom"("room_code");

-- CreateIndex
CREATE UNIQUE INDEX "Course_course_code_key" ON "Course"("course_code");

-- AddForeignKey
ALTER TABLE "ProfessorAvailability" ADD CONSTRAINT "ProfessorAvailability_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessorAvailability" ADD CONSTRAINT "ProfessorAvailability_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "Professor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
