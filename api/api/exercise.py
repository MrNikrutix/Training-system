from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.exercise import Exercise
from models.tag import Tag
from schemas.exercise import ExerciseResponse, ExerciseCreate, ExerciseUpdate
from typing import List

router = APIRouter()

# Exercises endpoints
@router.get("/", response_model=List[ExerciseResponse])
def get_exercises(db: Session = Depends(get_db)):
    try:
        exercises = db.query(Exercise).all()
        return exercises
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać ćwiczeń")

@router.post("/", response_model=ExerciseResponse, status_code=201)
def create_exercise(exercise: ExerciseCreate, db: Session = Depends(get_db)):
    try:
        # Validation
        if not exercise.name:
            raise HTTPException(status_code=400, detail="Nazwa jest wymagana i musi być tekstem")
        
        # Create exercise
        db_exercise = Exercise(
            name=exercise.name,
            instructions=exercise.instructions,
            enrichment=exercise.enrichment,
            videoUrl=exercise.videoUrl,
            crop_id=exercise.crop_id
        )
        db.add(db_exercise)
        db.flush()
        
        # Add tags if provided
        if exercise.tag_ids:
            for tag_id in exercise.tag_ids:
                tag = db.query(Tag).filter(Tag.id == tag_id).first()
                if tag:
                    db_exercise.tags.append(tag)
        
        db.commit()
        db.refresh(db_exercise)
        return db_exercise
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się utworzyć ćwiczenia: {str(e)}")

@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_exercise(exercise_id: int, db: Session = Depends(get_db)):
    try:
        exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
        if not exercise:
            raise HTTPException(status_code=404, detail="Ćwiczenie nie zostało znalezione")
        return exercise
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać ćwiczenia")

@router.put("/{exercise_id}", response_model=ExerciseResponse)
def update_exercise(exercise_id: int, exercise: ExerciseUpdate, db: Session = Depends(get_db)):
    try:
        # Validation
        if not exercise.name:
            raise HTTPException(status_code=400, detail="Nazwa jest wymagana i musi być tekstem")
        
        db_exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
        if not db_exercise:
            raise HTTPException(status_code=404, detail="Ćwiczenie nie zostało znalezione")
        
        # Update exercise basic fields
        db_exercise.name = exercise.name
        db_exercise.instructions = exercise.instructions
        db_exercise.enrichment = exercise.enrichment
        db_exercise.videoUrl = exercise.videoUrl
        db_exercise.crop_id = exercise.crop_id
        
        # Update tags if provided
        if exercise.tag_ids is not None:
            # Clear existing tags
            db_exercise.tags = []
            
            # Add new tags
            for tag_id in exercise.tag_ids:
                tag = db.query(Tag).filter(Tag.id == tag_id).first()
                if tag:
                    db_exercise.tags.append(tag)
        
        db.commit()
        db.refresh(db_exercise)
        return db_exercise
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się zaktualizować ćwiczenia: {str(e)}")

@router.delete("/{exercise_id}")
def delete_exercise(exercise_id: int, db: Session = Depends(get_db)):
    import os
    import logging
    from pathlib import Path
    from models.analyser import CroppedVideo, AnnotationAnalyser
    
    logger = logging.getLogger(__name__)
    
    try:
        # 1. Find the exercise
        db_exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
        if not db_exercise:
            raise HTTPException(status_code=404, detail="Ćwiczenie nie zostało znalezione")
        
        # 2. Find any cropped videos associated with this exercise
        cropped_videos = db.query(CroppedVideo).filter(CroppedVideo.crop_id == exercise_id).all()
        
        for cropped_video in cropped_videos:
            # 3. Find the annotation associated with this cropped video
            annotation = db.query(AnnotationAnalyser).filter(AnnotationAnalyser.id == cropped_video.anno_id).first()
            
            if annotation:
                # 4. Set the annotation's saved status to false
                annotation.saved = False
                logger.info(f"Resetowanie statusu 'saved' dla adnotacji {annotation.id}")
            
            # 5. Delete the video file if it exists
            if cropped_video.video_url:
                try:
                    video_path = None
                    
                    # Handle relative paths starting with /uploads/
                    if cropped_video.video_url.startswith('/uploads/'):
                        project_root = Path(__file__).resolve().parents[2]  # api/api/exercise.py -> api/api -> api -> root
                        public_uploads_path = project_root / "public" / "uploads"
                        filename = cropped_video.video_url.replace('/uploads/', '')
                        video_path = public_uploads_path / filename
                    else:
                        # Try to use the path as is
                        video_path = Path(cropped_video.video_url)
                    
                    if video_path and video_path.exists() and video_path.is_file():
                        os.remove(video_path)
                        logger.info(f"Usunięto plik wideo: {video_path}")
                    else:
                        logger.warning(f"Nie znaleziono pliku wideo do usunięcia: {cropped_video.video_url}")
                except Exception as file_error:
                    logger.error(f"Błąd podczas usuwania pliku wideo: {str(file_error)}")
            
            # 6. Delete the cropped video record
            db.delete(cropped_video)
            logger.info(f"Usunięto rekord przyciętego wideo: {cropped_video.id}")
        
        # 7. Finally delete the exercise
        db.delete(db_exercise)
        db.commit()
        
        return {"message": "Ćwiczenie zostało usunięte wraz z powiązanymi plikami wideo"}
    except Exception as e:
        db.rollback()
        logger.error(f"Błąd podczas usuwania ćwiczenia: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Nie udało się usunąć ćwiczenia: {str(e)}")