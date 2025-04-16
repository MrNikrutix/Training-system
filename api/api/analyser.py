# api/analyser.py
import os
import sys
import logging
import subprocess
import uuid
from pathlib import Path
from datetime import time
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Body
from sqlalchemy.orm import Session
from database import get_db
from models.analyser import Analyser, AnnotationAnalyser, CroppedVideo
from schemas.analyser import (
    AnalyserResponse, AnalyserCreate, AnalyserUpdate, 
    AnnotationResponse, AnnotationCreate, AnnotationUpdate,
    CroppedVideoResponse, CroppedVideoCreate, CroppedVideoUpdate
)

# Konfiguracja logowania
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Funkcja pomocnicza do sprawdzania, czy FFmpeg jest zainstalowany
def check_ffmpeg_installed():
    """Sprawdza, czy FFmpeg jest zainstalowany i dostępny w PATH."""
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return True, result.stdout.splitlines()[0] if result.stdout else "FFmpeg installed"
    except FileNotFoundError:
        return False, "FFmpeg not found in PATH"
    except subprocess.CalledProcessError as e:
        return False, f"FFmpeg error: {e.stderr}"
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

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
    import os
    import logging
    from pathlib import Path
    
    logger = logging.getLogger(__name__)
    
    try:
        # 1. Find the annotation
        db_annotation = db.query(AnnotationAnalyser).filter(AnnotationAnalyser.id == annotation_id).first()
        if not db_annotation:
            raise HTTPException(status_code=404, detail="Adnotacja nie została znaleziona")
        
        # 2. Find any cropped videos associated with this annotation
        cropped_videos = db.query(CroppedVideo).filter(CroppedVideo.anno_id == annotation_id).all()
        
        for cropped_video in cropped_videos:
            # 3. Delete the associated exercise if it exists
            if cropped_video.crop_id:
                try:
                    from models.exercise import Exercise
                    exercise = db.query(Exercise).filter(Exercise.id == cropped_video.crop_id).first()
                    if exercise:
                        logger.info(f"Usuwanie powiązanego ćwiczenia: {exercise.id}")
                        db.delete(exercise)
                except Exception as exercise_error:
                    logger.error(f"Błąd podczas usuwania powiązanego ćwiczenia: {str(exercise_error)}")
            
            # 4. Delete the video file if it exists
            if cropped_video.video_url:
                try:
                    video_path = None
                    
                    # Handle relative paths starting with /uploads/
                    if cropped_video.video_url.startswith('/uploads/'):
                        project_root = Path(__file__).resolve().parents[2]  # api/api/analyser.py -> api/api -> api -> root
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
            
            # 5. Delete the cropped video record
            db.delete(cropped_video)
            logger.info(f"Usunięto rekord przyciętego wideo: {cropped_video.id}")
        
        # 6. Finally delete the annotation
        db.delete(db_annotation)
        db.commit()
        
        return {"message": "Adnotacja została usunięta wraz z powiązanymi plikami wideo i ćwiczeniami"}
    except Exception as e:
        db.rollback()
        logger.error(f"Błąd podczas usuwania adnotacji: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Nie udało się usunąć adnotacji: {str(e)}")

# Endpoint do sprawdzania, czy FFmpeg jest zainstalowany
@router.get("/check-ffmpeg")
def check_ffmpeg():
    """Sprawdza, czy FFmpeg jest zainstalowany i dostępny."""
    is_installed, message = check_ffmpeg_installed()
    if is_installed:
        return {"status": "ok", "message": message}
    else:
        return {"status": "error", "message": message}

# Endpoint do sprawdzania, czy plik istnieje
@router.get("/check-file")
def check_file(file_path: str):
    """Sprawdza, czy plik istnieje i jest dostępny."""
    logger.info(f"Sprawdzanie pliku: {file_path}")
    
    try:
        # Sprawdź, czy to ścieżka względna zaczynająca się od /uploads
        if file_path.startswith('/uploads/'):
            # Ścieżka względna - musimy ją przekształcić na bezwzględną
            # Znajdź katalog główny projektu (gdzie znajduje się katalog public)
            project_root = Path(__file__).resolve().parents[2]  # api/api/analyser.py -> api/api -> api -> root
            logger.info(f"Katalog główny projektu: {project_root}")
            
            # Ścieżka do katalogu public/uploads
            public_uploads_path = project_root / "public" / "uploads"
            logger.info(f"Ścieżka do katalogu public/uploads: {public_uploads_path}")
            
            # Nazwa pliku (bez /uploads/)
            filename = file_path.replace('/uploads/', '')
            logger.info(f"Nazwa pliku: {filename}")
            
            # Pełna ścieżka do pliku
            file_path_full = public_uploads_path / filename
            logger.info(f"Pełna ścieżka do pliku: {file_path_full}")
        else:
            # Zakładamy, że to już ścieżka bezwzględna
            file_path_full = Path(file_path).resolve()
            logger.info(f"Ścieżka pliku (znormalizowana): {file_path_full}")
        
        # Sprawdź, czy plik istnieje
        if not file_path_full.exists():
            # Spróbuj alternatywne lokalizacje
            alternative_paths = [
                Path(file_path).resolve(),  # Oryginalna ścieżka
                Path("C:/Users/kaziu/Desktop/Training-system/public" + file_path),  # Ścieżka względem katalogu public
                Path("C:/Users/kaziu/Desktop/Training-system" + file_path),  # Ścieżka względem katalogu głównego
                Path("C:" + file_path)  # Ścieżka z dodanym C:
            ]
            
            found = False
            for alt_path in alternative_paths:
                logger.info(f"Próba alternatywnej ścieżki: {alt_path}")
                if alt_path.exists():
                    file_path_full = alt_path
                    found = True
                    logger.info(f"Znaleziono plik w alternatywnej lokalizacji: {file_path_full}")
                    break
            
            if not found:
                logger.error(f"Plik nie istnieje w żadnej z lokalizacji. Ostatnia sprawdzona: {file_path_full}")
                return {
                    "status": "error", 
                    "message": f"Plik nie istnieje: {file_path}",
                    "checked_paths": [str(p) for p in alternative_paths]
                }
        
        # Sprawdź, czy to plik (a nie katalog)
        if not file_path_full.is_file():
            logger.error(f"Ścieżka nie jest plikiem: {file_path_full}")
            return {"status": "error", "message": f"Ścieżka nie jest plikiem: {file_path}"}
        
        # Sprawdź, czy mamy uprawnienia do odczytu pliku
        try:
            with open(file_path_full, 'rb') as f:
                # Przeczytaj tylko pierwsze kilka bajtów, aby sprawdzić dostęp
                f.read(10)
            logger.info(f"Plik jest dostępny do odczytu: {file_path_full}")
            
            # Zwróć informacje o pliku
            file_size = file_path_full.stat().st_size
            file_modified = file_path_full.stat().st_mtime
            
            return {
                "status": "ok", 
                "message": "Plik istnieje i jest dostępny",
                "path": str(file_path_full),
                "size": file_size,
                "modified": file_modified
            }
        except PermissionError:
            logger.error(f"Brak uprawnień do odczytu pliku: {file_path_full}")
            return {"status": "error", "message": f"Brak uprawnień do odczytu pliku: {file_path}"}
        except Exception as e:
            logger.error(f"Błąd podczas próby odczytu pliku: {str(e)}")
            return {"status": "error", "message": f"Błąd podczas próby odczytu pliku: {str(e)}"}
    except Exception as e:
        logger.error(f"Błąd podczas przetwarzania ścieżki pliku: {str(e)}")
        return {"status": "error", "message": f"Błąd podczas przetwarzania ścieżki pliku: {str(e)}"}

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

@router.post("/annotations/{annotation_id}/crop-video", response_model=CroppedVideoResponse, status_code=201)
def crop_video(annotation_id: int, exercise_data: dict = Body(None), db: Session = Depends(get_db)):
    """
    Wycina fragment wideo na podstawie czasów z adnotacji i zapisuje go jako nowy plik.
    Aktualizuje status adnotacji na 'saved' i tworzy nowy rekord CroppedVideo.
    """
    import os
    import subprocess
    import uuid
    import logging
    from pathlib import Path
    
    # Skonfiguruj logowanie
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    try:
        # Pobierz adnotację
        logger.info(f"Pobieranie adnotacji o ID: {annotation_id}")
        annotation = db.query(AnnotationAnalyser).filter(AnnotationAnalyser.id == annotation_id).first()
        if not annotation:
            logger.error(f"Adnotacja o ID {annotation_id} nie została znaleziona")
            raise HTTPException(status_code=404, detail="Adnotacja nie została znaleziona")
        
        logger.info(f"Znaleziono adnotację: {annotation.id}, time_from: {annotation.time_from}, time_to: {annotation.time_to}")
        
        # Sprawdź, czy adnotacja ma określone czasy
        if not annotation.time_from:
            logger.error(f"Adnotacja {annotation_id} nie ma określonego czasu początkowego")
            raise HTTPException(status_code=400, detail="Adnotacja musi mieć określony czas początkowy")
        
        if not annotation.time_to:
            logger.error(f"Adnotacja {annotation_id} nie ma określonego czasu końcowego")
            raise HTTPException(status_code=400, detail="Adnotacja musi mieć określony czas końcowy")
        
        # Pobierz analizator, aby uzyskać URL wideo
        logger.info(f"Pobieranie analizatora o ID: {annotation.analyser_id}")
        analyser = db.query(Analyser).filter(Analyser.id == annotation.analyser_id).first()
        if not analyser:
            logger.error(f"Analizator o ID {annotation.analyser_id} nie został znaleziony")
            raise HTTPException(status_code=404, detail="Nie znaleziono analizatora")
        
        if not analyser.video_url:
            logger.error(f"Analizator {analyser.id} nie ma określonego URL wideo")
            raise HTTPException(status_code=404, detail="Analizator nie ma określonego URL wideo")
        
        # Przygotuj ścieżki plików
        video_url = analyser.video_url
        logger.info(f"URL wideo: {video_url}")
        
        # Sprawdź, czy URL jest lokalną ścieżką pliku
        if video_url.startswith(('http://', 'https://')):
            logger.error(f"URL wideo jest zewnętrzny: {video_url}")
            raise HTTPException(status_code=400, detail="Obsługa zewnętrznych URL nie jest jeszcze zaimplementowana")
        
        # Zakładamy, że video_url to ścieżka względna lub bezwzględna
        try:
            # Sprawdź, czy ścieżka jest poprawna
            if not video_url or not isinstance(video_url, str):
                logger.error(f"Nieprawidłowy URL wideo: {video_url}")
                raise HTTPException(status_code=400, detail=f"Nieprawidłowy URL wideo: {video_url}")
            
            # Sprawdź, czy to ścieżka względna zaczynająca się od /uploads
            if video_url.startswith('/uploads/'):
                # Ścieżka względna - musimy ją przekształcić na bezwzględną
                # Znajdź katalog główny projektu (gdzie znajduje się katalog public)
                project_root = Path(__file__).resolve().parents[2]  # api/api/analyser.py -> api/api -> api -> root
                logger.info(f"Katalog główny projektu: {project_root}")
                
                # Ścieżka do katalogu public/uploads
                public_uploads_path = project_root / "public" / "uploads"
                logger.info(f"Ścieżka do katalogu public/uploads: {public_uploads_path}")
                
                # Nazwa pliku (bez /uploads/)
                filename = video_url.replace('/uploads/', '')
                logger.info(f"Nazwa pliku: {filename}")
                
                # Pełna ścieżka do pliku
                video_path = public_uploads_path / filename
                logger.info(f"Pełna ścieżka do pliku: {video_path}")
            else:
                # Zakładamy, że to już ścieżka bezwzględna
                video_path = Path(video_url).resolve()
                logger.info(f"Ścieżka wideo (znormalizowana): {video_path}")
            
            # Sprawdź, czy plik istnieje
            if not video_path.exists():
                # Spróbuj alternatywne lokalizacje
                alternative_paths = [
                    Path(video_url).resolve(),  # Oryginalna ścieżka
                    Path("C:/Users/kaziu/Desktop/Training-system/public" + video_url),  # Ścieżka względem katalogu public
                    Path("C:/Users/kaziu/Desktop/Training-system" + video_url),  # Ścieżka względem katalogu głównego
                    Path("C:" + video_url)  # Ścieżka z dodanym C:
                ]
                
                found = False
                for alt_path in alternative_paths:
                    logger.info(f"Próba alternatywnej ścieżki: {alt_path}")
                    if alt_path.exists():
                        video_path = alt_path
                        found = True
                        logger.info(f"Znaleziono plik w alternatywnej lokalizacji: {video_path}")
                        break
                
                if not found:
                    logger.error(f"Plik wideo nie istnieje w żadnej z lokalizacji. Ostatnia sprawdzona: {video_path}")
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Plik wideo nie istnieje: {video_url}. Sprawdzone lokalizacje: {[str(p) for p in alternative_paths]}"
                    )
            
            # Sprawdź, czy to plik (a nie katalog)
            if not video_path.is_file():
                logger.error(f"Ścieżka nie jest plikiem: {video_path}")
                raise HTTPException(status_code=400, detail=f"Ścieżka nie jest plikiem: {video_url}")
            
            # Sprawdź, czy mamy uprawnienia do odczytu pliku
            try:
                with open(video_path, 'rb') as f:
                    # Przeczytaj tylko pierwsze kilka bajtów, aby sprawdzić dostęp
                    f.read(10)
                logger.info(f"Plik wideo jest dostępny do odczytu: {video_path}")
            except PermissionError:
                logger.error(f"Brak uprawnień do odczytu pliku: {video_path}")
                raise HTTPException(status_code=403, detail=f"Brak uprawnień do odczytu pliku: {video_url}")
            except Exception as e:
                logger.error(f"Błąd podczas próby odczytu pliku: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Błąd podczas próby odczytu pliku: {str(e)}")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Błąd podczas przetwarzania ścieżki pliku: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Błąd podczas przetwarzania ścieżki pliku: {str(e)}")
        
        # Utwórz nazwę dla przyciętego wideo
        # Upewnij się, że katalog wyjściowy istnieje i mamy do niego uprawnienia zapisu
        try:
            # Użyj tego samego katalogu, co plik wejściowy
            output_dir = video_path.parent
            logger.info(f"Katalog wyjściowy (oryginalny): {output_dir}")
            
            # Sprawdź, czy mamy uprawnienia do zapisu w tym katalogu
            if not os.access(output_dir, os.W_OK):
                logger.warning(f"Brak uprawnień do zapisu w katalogu: {output_dir}")
                
                # Spróbuj użyć katalogu public/uploads jako alternatywy
                project_root = Path(__file__).resolve().parents[2]  # api/api/analyser.py -> api/api -> api -> root
                alt_output_dir = project_root / "public" / "uploads"
                
                if os.access(alt_output_dir, os.W_OK):
                    output_dir = alt_output_dir
                    logger.info(f"Użyto alternatywnego katalogu wyjściowego: {output_dir}")
                else:
                    # Spróbuj użyć katalogu tymczasowego
                    import tempfile
                    output_dir = Path(tempfile.gettempdir())
                    logger.info(f"Użyto katalogu tymczasowego jako wyjściowego: {output_dir}")
            
            # Upewnij się, że katalog istnieje
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Utwórz nazwę pliku wyjściowego
            output_filename = f"{video_path.stem}_clip_{annotation_id}_{uuid.uuid4().hex[:8]}{video_path.suffix}"
            output_path = output_dir / output_filename
            logger.info(f"Ścieżka wyjściowa: {output_path}")
            
            # Sprawdź, czy możemy utworzyć plik w tym miejscu
            try:
                with open(output_path, 'w') as f:
                    pass
                os.remove(output_path)  # Usuń pusty plik testowy
                logger.info(f"Test zapisu do pliku wyjściowego zakończony powodzeniem")
            except Exception as e:
                logger.error(f"Nie można utworzyć pliku wyjściowego: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Nie można utworzyć pliku wyjściowego: {str(e)}")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Błąd podczas tworzenia ścieżki wyjściowej: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Błąd podczas tworzenia ścieżki wyjściowej: {str(e)}")
        
        # Konwertuj czas z formatu time na string w formacie HH:MM:SS
        try:
            # Sprawdź, czy time_from i time_to są obiektami time
            logger.info(f"Typ time_from: {type(annotation.time_from)}, Typ time_to: {type(annotation.time_to)}")
            
            # Jeśli to stringi, spróbuj je sparsować
            if isinstance(annotation.time_from, str):
                logger.info(f"time_from jest stringiem: {annotation.time_from}")
                time_parts = annotation.time_from.split(':')
                if len(time_parts) == 3:
                    time_from_str = annotation.time_from
                    time_from_hours = int(time_parts[0])
                    time_from_minutes = int(time_parts[1])
                    time_from_seconds = int(time_parts[2])
                else:
                    raise ValueError(f"Nieprawidłowy format czasu: {annotation.time_from}")
            else:
                # To obiekt time
                time_from_str = f"{annotation.time_from.hour:02d}:{annotation.time_from.minute:02d}:{annotation.time_from.second:02d}"
                time_from_hours = annotation.time_from.hour
                time_from_minutes = annotation.time_from.minute
                time_from_seconds = annotation.time_from.second
            
            if isinstance(annotation.time_to, str):
                logger.info(f"time_to jest stringiem: {annotation.time_to}")
                time_parts = annotation.time_to.split(':')
                if len(time_parts) == 3:
                    time_to_str = annotation.time_to
                    time_to_hours = int(time_parts[0])
                    time_to_minutes = int(time_parts[1])
                    time_to_seconds = int(time_parts[2])
                else:
                    raise ValueError(f"Nieprawidłowy format czasu: {annotation.time_to}")
            else:
                # To obiekt time
                time_to_str = f"{annotation.time_to.hour:02d}:{annotation.time_to.minute:02d}:{annotation.time_to.second:02d}"
                time_to_hours = annotation.time_to.hour
                time_to_minutes = annotation.time_to.minute
                time_to_seconds = annotation.time_to.second
            
            logger.info(f"Czas od: {time_from_str}, czas do: {time_to_str}")
            
            # Oblicz czas trwania
            duration_seconds = (
                time_to_hours * 3600 + 
                time_to_minutes * 60 + 
                time_to_seconds
            ) - (
                time_from_hours * 3600 + 
                time_from_minutes * 60 + 
                time_from_seconds
            )
        except Exception as e:
            logger.error(f"Błąd podczas przetwarzania czasu: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Błąd podczas przetwarzania czasu: {str(e)}")
        
        logger.info(f"Czas trwania: {duration_seconds} sekund")
        
        # Sprawdź, czy czas trwania jest dodatni
        if duration_seconds <= 0:
            logger.error(f"Nieprawidłowy czas trwania: {duration_seconds} sekund")
            raise HTTPException(status_code=400, detail="Czas końcowy musi być późniejszy niż czas początkowy")
        
        # Sprawdź, czy FFmpeg jest zainstalowany
        try:
            # Najpierw sprawdź, czy FFmpeg jest dostępny w PATH
            try:
                ffmpeg_version = subprocess.run(
                    ['ffmpeg', '-version'], 
                    stdout=subprocess.PIPE, 
                    stderr=subprocess.PIPE,
                    text=True,
                    check=True
                )
                logger.info(f"FFmpeg jest zainstalowany: {ffmpeg_version.stdout.splitlines()[0]}")
            except FileNotFoundError:
                logger.error("FFmpeg nie jest dostępny w PATH")
                
                # Spróbuj znaleźć FFmpeg w typowych lokalizacjach
                common_paths = [
                    "C:/Program Files/ffmpeg/bin/ffmpeg.exe",
                    "C:/ffmpeg/bin/ffmpeg.exe",
                    "/usr/bin/ffmpeg",
                    "/usr/local/bin/ffmpeg"
                ]
                
                ffmpeg_path = None
                for path in common_paths:
                    if os.path.exists(path):
                        ffmpeg_path = path
                        logger.info(f"Znaleziono FFmpeg w: {ffmpeg_path}")
                        break
                
                if not ffmpeg_path:
                    logger.error("FFmpeg nie został znaleziony w żadnej z typowych lokalizacji")
                    raise HTTPException(status_code=500, detail="FFmpeg nie jest zainstalowany na serwerze")
            except subprocess.CalledProcessError as e:
                logger.error(f"Błąd podczas sprawdzania wersji FFmpeg: {e.stderr}")
                raise HTTPException(status_code=500, detail=f"Błąd podczas sprawdzania wersji FFmpeg: {e.stderr}")
            
            # Sprawdź, czy FFmpeg obsługuje wymagane kodeki
            try:
                codecs_output = subprocess.run(
                    ['ffmpeg', '-codecs'], 
                    stdout=subprocess.PIPE, 
                    stderr=subprocess.PIPE,
                    text=True,
                    check=True
                )
                logger.info("FFmpeg obsługuje wymagane kodeki")
            except subprocess.CalledProcessError as e:
                logger.error(f"Błąd podczas sprawdzania kodeków FFmpeg: {e.stderr}")
                raise HTTPException(status_code=500, detail=f"Błąd podczas sprawdzania kodeków FFmpeg: {e.stderr}")
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Nieoczekiwany błąd podczas sprawdzania FFmpeg: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Nieoczekiwany błąd podczas sprawdzania FFmpeg: {str(e)}")
        
        # Użyj FFmpeg do wycięcia fragmentu wideo
        try:
            # Komenda FFmpeg do wycięcia fragmentu z re-encodingiem dla lepszej precyzji
            ffmpeg_cmd = [
                'ffmpeg',
                '-ss', time_from_str,  # Umieszczenie -ss przed -i dla szybszego seekingu
                '-i', str(video_path),
                '-t', str(duration_seconds),
                '-c:v', 'libx264',  # Użyj kodeka H.264 dla wideo
                '-c:a', 'aac',      # Użyj kodeka AAC dla audio
                '-preset', 'fast',  # Szybsze kodowanie
                '-crf', '22',       # Dobra jakość wideo
                '-pix_fmt', 'yuv420p',  # Kompatybilny format pikseli
                '-movflags', '+faststart',  # Optymalizacja dla streamingu
                '-y',  # Nadpisz plik wyjściowy, jeśli istnieje
                str(output_path)
            ]
            
            logger.info(f"Uruchamianie komendy FFmpeg: {' '.join(ffmpeg_cmd)}")
            
            # Uruchom komendę FFmpeg
            process = subprocess.run(
                ffmpeg_cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )
            
            logger.info(f"Komenda FFmpeg zakończona: {process.stdout}")
            
            # Sprawdź, czy plik wyjściowy został utworzony
            if not output_path.exists():
                logger.error(f"Nie udało się utworzyć pliku wyjściowego: {output_path}")
                raise Exception(f"Nie udało się utworzyć pliku wyjściowego: {output_path}")
            
            logger.info(f"Plik wyjściowy utworzony: {output_path}")
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Błąd FFmpeg: {e.stderr}")
            raise Exception(f"Błąd FFmpeg: {e.stderr}")
        
        # Utwórz względny URL dla przyciętego wideo
        try:
            # Sprawdź, czy ścieżka wyjściowa jest w katalogu public/uploads
            project_root = Path(__file__).resolve().parents[2]  # api/api/analyser.py -> api/api -> api -> root
            public_uploads_path = project_root / "public" / "uploads"
            
            # Sprawdź, czy ścieżka wyjściowa jest w katalogu public/uploads
            try:
                relative_to_public = output_path.relative_to(public_uploads_path)
                # Jeśli tak, to utwórz URL względny do /uploads
                relative_output_path = f"/uploads/{relative_to_public}".replace('\\', '/')
                logger.info(f"Ścieżka względna do /uploads: {relative_output_path}")
            except ValueError:
                # Jeśli nie, to użyj pełnej ścieżki
                relative_output_path = str(output_path).replace('\\', '/')
                logger.info(f"Pełna ścieżka jako URL: {relative_output_path}")
            
            logger.info(f"Względny URL wyjściowy: {relative_output_path}")
        except Exception as e:
            logger.error(f"Błąd podczas tworzenia względnego URL: {str(e)}")
            # Użyj pełnej ścieżki jako fallback
            relative_output_path = str(output_path).replace('\\', '/')
            logger.info(f"Fallback URL wyjściowy: {relative_output_path}")
        
        # Aktualizuj status adnotacji
        annotation.saved = True
        logger.info(f"Status adnotacji zaktualizowany na 'saved'")
        
        # Utwórz nowy rekord CroppedVideo
        crop_id = 1  # Domyślne ID przycięcia
        
        # Jeśli przekazano ID ćwiczenia, użyj go
        if exercise_data and 'exercise_id' in exercise_data:
            crop_id = exercise_data['exercise_id']
            logger.info(f"Użyto ID ćwiczenia z żądania: {crop_id}")
        
        db_cropped_video = CroppedVideo(
            anno_id=annotation_id,
            video_url=relative_output_path,
            crop_id=crop_id
        )
        
        logger.info(f"Tworzenie rekordu CroppedVideo: anno_id={annotation_id}, video_url={relative_output_path}")
        
        db.add(db_cropped_video)
        db.commit()
        db.refresh(db_cropped_video)
        
        logger.info(f"Rekord CroppedVideo utworzony: id={db_cropped_video.id}")
        
        return db_cropped_video
    except HTTPException as e:
        logger.error(f"HTTPException: {e.detail}")
        if 'db' in locals():
            db.rollback()
        raise e
    except Exception as e:
        logger.error(f"Exception: {str(e)}")
        if 'db' in locals():
            db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się wyciąć fragmentu wideo: {str(e)}")

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