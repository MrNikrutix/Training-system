# api/analyser.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.analyser import Analyser, AnnotationAnalyser, CroppedVideo
from schemas.analyser import (
    AnalyserResponse, AnalyserCreate, AnalyserUpdate, 
    AnnotationResponse, AnnotationCreate, AnnotationUpdate,
    CroppedVideoResponse, CroppedVideoCreate, CroppedVideoUpdate
)
from typing import List

router = APIRouter()

# Analyser endpoints
@router.get("/", response_model=List[AnalyserResponse])
def get_analysers(db: Session = Depends(get_db)):
    try:
        analysers = db.query(Analyser).all()
        return analysers
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać analizatorów")

@router.post("/", response_model=AnalyserResponse, status_code=201)
def create_analyser(analyser: AnalyserCreate, db: Session = Depends(get_db)):
    try:
        # Validation
        if not analyser.name or not analyser.video_url:
            raise HTTPException(status_code=400, detail="Nazwa i URL wideo są wymagane")
        
        # Create analyser
        db_analyser = Analyser(
            name=analyser.name,
            video_url=analyser.video_url
        )
        
        db.add(db_analyser)
        db.commit()
        db.refresh(db_analyser)
        return db_analyser
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się utworzyć analizatora: {str(e)}")

@router.get("/{analyser_id}", response_model=AnalyserResponse)
def get_analyser(analyser_id: int, db: Session = Depends(get_db)):
    try:
        analyser = db.query(Analyser).filter(Analyser.id == analyser_id).first()
        if not analyser:
            raise HTTPException(status_code=404, detail="Analizator nie został znaleziony")
        return analyser
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać analizatora")

@router.put("/{analyser_id}", response_model=AnalyserResponse)
def update_analyser(analyser_id: int, analyser: AnalyserUpdate, db: Session = Depends(get_db)):
    try:
        # Validation
        if not analyser.name or not analyser.video_url:
            raise HTTPException(status_code=400, detail="Nazwa i URL wideo są wymagane")
        
        db_analyser = db.query(Analyser).filter(Analyser.id == analyser_id).first()
        if not db_analyser:
            raise HTTPException(status_code=404, detail="Analizator nie został znaleziony")
        
        # Update analyser fields
        db_analyser.name = analyser.name
        db_analyser.video_url = analyser.video_url
        
        db.commit()
        db.refresh(db_analyser)
        return db_analyser
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się zaktualizować analizatora: {str(e)}")

@router.delete("/{analyser_id}")
def delete_analyser(analyser_id: int, db: Session = Depends(get_db)):
    try:
        db_analyser = db.query(Analyser).filter(Analyser.id == analyser_id).first()
        if not db_analyser:
            raise HTTPException(status_code=404, detail="Analizator nie został znaleziony")
        
        db.delete(db_analyser)
        db.commit()
        return {"message": "Analizator został usunięty"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się usunąć analizatora: {str(e)}")

# Annotation endpoints
@router.get("/{analyser_id}/annotations", response_model=List[AnnotationResponse])
def get_annotations(analyser_id: int, db: Session = Depends(get_db)):
    try:
        annotations = db.query(AnnotationAnalyser).filter(AnnotationAnalyser.analyser_id == analyser_id).all()
        return annotations
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać adnotacji")

@router.post("/{analyser_id}/annotations", response_model=AnnotationResponse, status_code=201)
def create_annotation(analyser_id: int, annotation: AnnotationCreate, db: Session = Depends(get_db)):
    try:
        # Check if analyser exists
        analyser = db.query(Analyser).filter(Analyser.id == analyser_id).first()
        if not analyser:
            raise HTTPException(status_code=404, detail="Analizator nie został znaleziony")
        
        # Create annotation
        db_annotation = AnnotationAnalyser(
            analyser_id=analyser_id,
            time_from=annotation.time_from,
            time_to=annotation.time_to,
            title=annotation.title,
            description=annotation.description,
            color=annotation.color,
            saved=annotation.saved
        )
        
        db.add(db_annotation)
        db.commit()
        db.refresh(db_annotation)
        return db_annotation
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się utworzyć adnotacji: {str(e)}")

@router.get("/annotations/{annotation_id}", response_model=AnnotationResponse)
def get_annotation(annotation_id: int, db: Session = Depends(get_db)):
    try:
        annotation = db.query(AnnotationAnalyser).filter(AnnotationAnalyser.id == annotation_id).first()
        if not annotation:
            raise HTTPException(status_code=404, detail="Adnotacja nie została znaleziona")
        return annotation
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać adnotacji")

@router.put("/annotations/{annotation_id}", response_model=AnnotationResponse)
def update_annotation(annotation_id: int, annotation: AnnotationUpdate, db: Session = Depends(get_db)):
    try:
        db_annotation = db.query(AnnotationAnalyser).filter(AnnotationAnalyser.id == annotation_id).first()
        if not db_annotation:
            raise HTTPException(status_code=404, detail="Adnotacja nie została znaleziona")
        
        # Update annotation fields
        if annotation.analyser_id is not None:
            db_annotation.analyser_id = annotation.analyser_id
        db_annotation.time_from = annotation.time_from
        db_annotation.time_to = annotation.time_to
        db_annotation.title = annotation.title
        db_annotation.description = annotation.description
        db_annotation.color = annotation.color
        db_annotation.saved = annotation.saved
        
        db.commit()
        db.refresh(db_annotation)
        return db_annotation
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się zaktualizować adnotacji: {str(e)}")

@router.delete("/annotations/{annotation_id}")
def delete_annotation(annotation_id: int, db: Session = Depends(get_db)):
    try:
        db_annotation = db.query(AnnotationAnalyser).filter(AnnotationAnalyser.id == annotation_id).first()
        if not db_annotation:
            raise HTTPException(status_code=404, detail="Adnotacja nie została znaleziona")
        
        db.delete(db_annotation)
        db.commit()
        return {"message": "Adnotacja została usunięta"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się usunąć adnotacji: {str(e)}")

# Cropped Video endpoints
@router.get("/annotations/{annotation_id}/cropped-videos", response_model=List[CroppedVideoResponse])
def get_cropped_videos(annotation_id: int, db: Session = Depends(get_db)):
    try:
        cropped_videos = db.query(CroppedVideo).filter(CroppedVideo.anno_id == annotation_id).all()
        return cropped_videos
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać przyciętych filmów")

@router.post("/annotations/{annotation_id}/cropped-videos", response_model=CroppedVideoResponse, status_code=201)
def create_cropped_video(annotation_id: int, cropped_video: CroppedVideoCreate, db: Session = Depends(get_db)):
    try:
        # Check if annotation exists
        annotation = db.query(AnnotationAnalyser).filter(AnnotationAnalyser.id == annotation_id).first()
        if not annotation:
            raise HTTPException(status_code=404, detail="Adnotacja nie została znaleziona")
        
        # Create cropped video
        db_cropped_video = CroppedVideo(
            anno_id=annotation_id,
            video_url=cropped_video.video_url,
            crop_id=cropped_video.crop_id
        )
        
        db.add(db_cropped_video)
        db.commit()
        db.refresh(db_cropped_video)
        return db_cropped_video
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się utworzyć przyciętego filmu: {str(e)}")

@router.get("/cropped-videos/{cropped_video_id}", response_model=CroppedVideoResponse)
def get_cropped_video(cropped_video_id: int, db: Session = Depends(get_db)):
    try:
        cropped_video = db.query(CroppedVideo).filter(CroppedVideo.id == cropped_video_id).first()
        if not cropped_video:
            raise HTTPException(status_code=404, detail="Przycięty film nie został znaleziony")
        return cropped_video
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać przyciętego filmu")

@router.put("/cropped-videos/{cropped_video_id}", response_model=CroppedVideoResponse)
def update_cropped_video(cropped_video_id: int, cropped_video: CroppedVideoUpdate, db: Session = Depends(get_db)):
    try:
        db_cropped_video = db.query(CroppedVideo).filter(CroppedVideo.id == cropped_video_id).first()
        if not db_cropped_video:
            raise HTTPException(status_code=404, detail="Przycięty film nie został znaleziony")
        
        # Update cropped video fields
        if cropped_video.anno_id is not None:
            db_cropped_video.anno_id = cropped_video.anno_id
        if cropped_video.video_url is not None:
            db_cropped_video.video_url = cropped_video.video_url
        if cropped_video.crop_id is not None:
            db_cropped_video.crop_id = cropped_video.crop_id
        
        db.commit()
        db.refresh(db_cropped_video)
        return db_cropped_video
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się zaktualizować przyciętego filmu: {str(e)}")

@router.delete("/cropped-videos/{cropped_video_id}")
def delete_cropped_video(cropped_video_id: int, db: Session = Depends(get_db)):
    try:
        db_cropped_video = db.query(CroppedVideo).filter(CroppedVideo.id == cropped_video_id).first()
        if not db_cropped_video:
            raise HTTPException(status_code=404, detail="Przycięty film nie został znaleziony")
        
        db.delete(db_cropped_video)
        db.commit()
        return {"message": "Przycięty film został usunięty"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się usunąć przyciętego filmu: {str(e)}")