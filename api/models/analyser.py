# models/analyser.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Time
from sqlalchemy.orm import relationship
from models.base import Base

class Analyser(Base):
    __tablename__ = "analyser"

    id = Column(Integer, primary_key=True, index=True)
    video_url = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    
    annotations = relationship("AnnotationAnalyser", back_populates="analyser")

class AnnotationAnalyser(Base):
    __tablename__ = "annotation_analyser"

    id = Column(Integer, primary_key=True, index=True)
    analyser_id = Column(Integer, ForeignKey("analyser.id"), nullable=False)
    time_from = Column(Time, nullable=False)
    time_to = Column(Time, nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    color = Column(String(50), nullable=False)
    saved = Column(Boolean, nullable=False, default=False)
    
    analyser = relationship("Analyser", back_populates="annotations")
    cropped_videos = relationship("CroppedVideo", back_populates="annotation")

class CroppedVideo(Base):
    __tablename__ = "cropped_video"

    id = Column(Integer, primary_key=True, index=True)
    anno_id = Column(Integer, ForeignKey("annotation_analyser.id"), nullable=False)
    video_url = Column(String(255), nullable=False)
    crop_id = Column(Integer, ForeignKey("exercises.crop_id"), nullable=False)
    
    annotation = relationship("AnnotationAnalyser", back_populates="cropped_videos")