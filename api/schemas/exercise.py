from pydantic import BaseModel
from typing import Optional, List
from schemas.tag import TagResponse

class ExerciseBase(BaseModel):
    name: str
    instructions: Optional[str] = None
    enrichment: Optional[str] = None
    videoUrl: Optional[str] = None
    crop_id: Optional[int] = None

class ExerciseCreate(ExerciseBase):
    tag_ids: Optional[List[int]] = None

class ExerciseUpdate(ExerciseBase):
    tag_ids: Optional[List[int]] = None

class ExerciseResponse(ExerciseBase):
    id: int
    tags: List[TagResponse] = []
    
    class Config:
        from_attributes = True