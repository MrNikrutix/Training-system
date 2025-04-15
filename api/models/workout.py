from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import Enum as SQLAlchemyEnum
from models.base import Base
import datetime
from enum import Enum

# Enumy
class ExerciseUnit(str, Enum):
    TIME = "CZAS"
    QUANTITY = "ILOŚĆ"

# Workout (plan treningowy)
class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(Date, nullable=False, default=datetime.date.today)
    duration = Column(Integer, nullable=True)
    
    sections = relationship(
        "WorkoutSection",
        back_populates="workout",
        cascade="all, delete-orphan"
    )

# Sekcja w treningu
class WorkoutSection(Base):
    __tablename__ = "workout_section"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    position = Column(Integer, nullable=False)
    
    workout = relationship("Workout", back_populates="sections")
    section_exercises = relationship(
        "SectionExercise",
        back_populates="section",
        cascade="all, delete-orphan"
    )
    exercises = relationship(
        "WorkoutExercise",
        secondary="section_exercises",
        back_populates="sections",
        overlaps="section_exercises,workout_exercise"
    )

# Ćwiczenie w treningu
class WorkoutExercise(Base):
    __tablename__ = "workout_exercise"

    id = Column(Integer, primary_key=True, index=True)
    ex_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    sets = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=True)
    unit = Column(SQLAlchemyEnum(ExerciseUnit), nullable=False)
    duration = Column(Integer, nullable=True)
    rest = Column(Integer, nullable=False)
    position = Column(Integer, nullable=False)
    
    section_exercises = relationship(
        "SectionExercise",
        back_populates="workout_exercise",
        cascade="all, delete-orphan"
    )
    sections = relationship(
        "WorkoutSection",
        secondary="section_exercises",
        back_populates="exercises",
        overlaps="section_exercises,section"
    )

# Powiązanie sekcji i ćwiczenia (wiele-do-wielu z dodatkowymi danymi)
class SectionExercise(Base):
    __tablename__ = "section_exercises"

    section_id = Column(Integer, ForeignKey("workout_section.id", ondelete="CASCADE"), primary_key=True)
    work_exercise_id = Column(Integer, ForeignKey("workout_exercise.id", ondelete="CASCADE"), primary_key=True)
    position = Column(Integer, nullable=False)

    section = relationship(
        "WorkoutSection",
        back_populates="section_exercises",
        overlaps="exercises,sections"
    )
    workout_exercise = relationship(
        "WorkoutExercise",
        back_populates="section_exercises",
        overlaps="sections,exercises"
    )