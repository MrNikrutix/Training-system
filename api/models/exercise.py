from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from models.base import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=True)
    enrichment = Column(Text, nullable=True)
    videoUrl = Column(String(255), nullable=True)
    crop_id = Column(Integer, nullable=True)
    
    tags = relationship("Tag", secondary="exercise_tags", back_populates="exercises")