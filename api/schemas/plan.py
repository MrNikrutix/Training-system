# schemas/plan.py
from pydantic import BaseModel
from typing import List, Optional, Union
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

# Schematy dla WorkoutPlan
class WorkoutPlanBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    day_of_week: DayOfWeek
    completed: bool = False
    notes: Optional[str] = None
    work_id: Optional[int] = None

class WorkoutPlanCreate(WorkoutPlanBase):
    plan_id: int
    week_id: int

class WorkoutPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    day_of_week: Optional[DayOfWeek] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None
    work_id: Optional[int] = None

class WorkoutPlanResponse(WorkoutPlanBase):
    id: int
    plan_id: int
    week_id: int
    
    class Config:
        from_attributes = True

# Schematy dla WeekPlan
class WeekPlanBase(BaseModel):
    position: int
    notes: Optional[str] = None

class WeekPlanCreate(WeekPlanBase):
    plan_id: int

class WeekPlanUpdate(BaseModel):
    position: Optional[int] = None
    notes: Optional[str] = None

class WeekPlanResponse(WeekPlanBase):
    id: int
    plan_id: int
    workouts: List[WorkoutPlanResponse] = []
    
    class Config:
        from_attributes = True

# Schematy dla Plan
class PlanBase(BaseModel):
    name: str
    event_date: datetime.date

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    event_date: Optional[datetime.date] = None

class PlanResponse(PlanBase):
    id: int
    weeks: List[WeekPlanResponse] = []
    
    class Config:
        from_attributes = True