from pydantic import BaseModel
from typing import List, Optional
import datetime
from enum import Enum

class ExerciseUnit(str, Enum):
    TIME = "CZAS"
    QUANTITY = "ILOŚĆ"

class WorkoutExerciseBase(BaseModel):
    ex_id: int
    sets: int
    quantity: Optional[int] = None
    unit: ExerciseUnit
    duration: Optional[int] = None
    rest: int
    position: int

class WorkoutExerciseCreate(WorkoutExerciseBase):
    pass

class WorkoutExerciseResponse(WorkoutExerciseBase):
    id: int
    
    class Config:
        from_attributes = True

class WorkoutSectionBase(BaseModel):
    name: str
    position: int

class WorkoutSectionCreate(WorkoutSectionBase):
    exercises: List[WorkoutExerciseCreate] = []

class WorkoutSectionResponse(WorkoutSectionBase):
    id: int
    work_id: int
    exercises: List[WorkoutExerciseResponse] = []
    
    class Config:
        from_attributes = True

class WorkoutBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None

class WorkoutCreate(WorkoutBase):
    sections: List[WorkoutSectionCreate]

class WorkoutResponse(WorkoutBase):
    id: int
    created_at: datetime.date
    sections: List[WorkoutSectionResponse]
    
    class Config:
        from_attributes = True


