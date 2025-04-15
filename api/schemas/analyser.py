# schemas/analyser.py
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import time

# Analyser Schemas
class AnalyserBase(BaseModel):
    video_url: str
    name: str

class AnalyserCreate(AnalyserBase):
    pass

class AnalyserUpdate(AnalyserBase):
    pass

# Annotation Schemas
class AnnotationBase(BaseModel):
    analyser_id: int
    time_from: time
    time_to: Optional[time] = None
    title: str
    description: Optional[str] = None
    color: str
    saved: bool = False
    
    @validator('time_from', 'time_to', pre=True)
    def parse_time(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                # Parse time string in format HH:MM:SS
                hours, minutes, seconds = map(int, value.split(':'))
                return time(hour=hours, minute=minutes, second=seconds)
            except (ValueError, TypeError):
                raise ValueError(f"Invalid time format: {value}. Expected format: HH:MM:SS")
        return value

class AnnotationCreate(AnnotationBase):
    pass

class AnnotationUpdate(AnnotationBase):
    analyser_id: Optional[int] = None

# Cropped Video Schemas
class CroppedVideoBase(BaseModel):
    anno_id: int
    video_url: str
    crop_id: int

class CroppedVideoCreate(CroppedVideoBase):
    pass

class CroppedVideoUpdate(CroppedVideoBase):
    anno_id: Optional[int] = None
    video_url: Optional[str] = None
    crop_id: Optional[int] = None

# Response Schemas
class CroppedVideoResponse(CroppedVideoBase):
    id: int
    
    class Config:
        from_attributes = True

class AnnotationResponse(AnnotationBase):
    id: int
    cropped_videos: List[CroppedVideoResponse] = []
    
    class Config:
        from_attributes = True

class AnalyserResponse(AnalyserBase):
    id: int
    annotations: List[AnnotationResponse] = []
    
    class Config:
        from_attributes = True