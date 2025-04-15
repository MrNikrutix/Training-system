from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from models.base import Base
import datetime
import enum

class DayOfWeek(str, enum.Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday" 
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

# Plan treningowy (główny)
class Plan(Base):
    __tablename__ = "plan"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    event_date = Column(Date, nullable=False)
    
    weeks = relationship(
        "WeekPlan",
        back_populates="plan",
        cascade="all, delete-orphan"
    )

# Tygodnie w planie treningowym
class WeekPlan(Base):
    __tablename__ = "week_plan"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plan.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)
    notes = Column(String, nullable=True)
    
    plan = relationship("Plan", back_populates="weeks")
    workouts = relationship(
        "WorkoutPlan",
        back_populates="week",
        cascade="all, delete-orphan"
    )

# Treningi w planie tygodniowym
class WorkoutPlan(Base):
    __tablename__ = "workout_plan"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plan.id", ondelete="CASCADE"), nullable=False)
    week_id = Column(Integer, ForeignKey("week_plan.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=True)
    description = Column(String, nullable=True)
    day_of_week = Column(SQLAlchemyEnum(DayOfWeek), nullable=False)
    completed = Column(Boolean, nullable=False, default=False)
    notes = Column(String, nullable=True)
    work_id = Column(Integer, ForeignKey("workouts.id", ondelete="SET NULL"), nullable=True)
    
    plan = relationship("Plan")
    week = relationship("WeekPlan", back_populates="workouts")
    workout = relationship("Workout")