from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    
    exercises = relationship("Exercise", secondary="exercise_tags", back_populates="tags")

class ExerciseTag(Base):
    __tablename__ = "exercise_tags"

    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    ex_id = Column(Integer, ForeignKey("exercises.id"), primary_key=True)