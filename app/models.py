from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# ---------------------------------------------------------
# 1. UNIVERSITY METADATA
# ---------------------------------------------------------
class UniversityMetadata(db.Model):
    __tablename__ = "university_metadata"

    id = db.Column(db.Integer, primary_key=True)
    university_name = db.Column(db.String(150), nullable=False)
    school_name = db.Column(db.String(150), nullable=False)
    semester_code = db.Column(db.String(10), nullable=False)  # e.g., 2025-A or 2025-B
    curriculum_name = db.Column(db.String(50), nullable=False)  # e.g., Second Semester
    block_duration_min = db.Column(db.Integer, nullable=False)
    day_start_time = db.Column(db.Time, nullable=False)
    day_end_time = db.Column(db.Time, nullable=False)


# ---------------------------------------------------------
# 2. TIME SLOTS
# ---------------------------------------------------------
class TimeSlot(db.Model):
    __tablename__ = "time_slots"

    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(db.String(3), nullable=False)  # MON, TUE, WED...
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("day_of_week", "start_time", "end_time", name="unique_timeslot"),
    )


# ---------------------------------------------------------
# 3. CLASSROOMS
# ---------------------------------------------------------
class Classroom(db.Model):
    __tablename__ = "classrooms"

    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), unique=True, nullable=False)
    room_name = db.Column(db.String(100), nullable=True)
    room_type = db.Column(db.String(10), nullable=False)  # THEORY or LAB
    capacity = db.Column(db.Integer, nullable=False)


# ---------------------------------------------------------
# 4. PROFESSORS
# ---------------------------------------------------------
class Professor(db.Model):
    __tablename__ = "professors"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    preferred_shift = db.Column(db.String(20), nullable=True)  # morning, afternoon...

    availabilities = db.relationship("ProfessorAvailability", back_populates="professor")
    courses = db.relationship("Course", back_populates="professor")


# ---------------------------------------------------------
# 5. PROFESSOR AVAILABILITY
# ---------------------------------------------------------
class ProfessorAvailability(db.Model):
    __tablename__ = "professor_availability"

    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(db.Integer, db.ForeignKey("professors.id"), nullable=False)
    time_slot_id = db.Column(db.Integer, db.ForeignKey("time_slots.id"), nullable=False)

    professor = db.relationship("Professor", back_populates="availabilities")
    time_slot = db.relationship("TimeSlot")


# ---------------------------------------------------------
# 6. COURSES
# ---------------------------------------------------------
class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    course_code = db.Column(db.String(20), unique=True, nullable=False)
    course_name = db.Column(db.String(100), nullable=False)
    credits = db.Column(db.Integer, nullable=False)
    theory_hours = db.Column(db.Integer, nullable=False)
    practice_hours = db.Column(db.Integer, nullable=False)
    lab_hours = db.Column(db.Integer, nullable=False)
    student_count = db.Column(db.Integer, nullable=False)
    classroom_type = db.Column(db.String(10), nullable=False)  # THEORY or LAB

    professor_id = db.Column(db.Integer, db.ForeignKey("professors.id"), nullable=True)
    professor = db.relationship("Professor", back_populates="courses")

    prerequisites = db.relationship("CoursePrerequisite", back_populates="course")
    curricula = db.relationship("Curriculum", back_populates="course")


# ---------------------------------------------------------
# 7. COURSE PREREQUISITES
# ---------------------------------------------------------
class CoursePrerequisite(db.Model):
    __tablename__ = "course_prerequisites"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    prerequisite_code = db.Column(db.String(20), nullable=False)

    course = db.relationship("Course", back_populates="prerequisites")


# ---------------------------------------------------------
# 8. CURRICULA
# ---------------------------------------------------------
class Curriculum(db.Model):
    __tablename__ = "curricula"

    id = db.Column(db.Integer, primary_key=True)
    curriculum_name = db.Column(db.String(100), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)

    course = db.relationship("Course", back_populates="curricula")


# ---------------------------------------------------------
# 9. OPTIMIZATION WEIGHTS (for the genetic algorithm)
# ---------------------------------------------------------
class OptimizationWeight(db.Model):
    __tablename__ = "optimization_weights"

    id = db.Column(db.Integer, primary_key=True)
    constraint_type = db.Column(db.String(20), nullable=False)  # HARD or SOFT
    constraint_name = db.Column(db.String(50), nullable=False)
    weight_value = db.Column(db.Integer, nullable=False)
