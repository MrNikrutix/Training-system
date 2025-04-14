from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Date, Text, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import datetime

# Database setup for MySQL
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:root@localhost/trainhub"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models - strictly based on the provided SQL schema
class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=True)
    enrichment = Column(Text, nullable=True)
    videoUrl = Column(String(255), nullable=True)
    crop_id = Column(Integer, nullable=True)
    
    # Relationships
    tags = relationship("Tag", secondary="exercise_tags", back_populates="exercises")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    
    # Relationships
    exercises = relationship("Exercise", secondary="exercise_tags", back_populates="tags")

class ExerciseTag(Base):
    __tablename__ = "exercise_tags"

    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    ex_id = Column(Integer, ForeignKey("exercises.id"), primary_key=True)

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(Date, nullable=False, default=datetime.date.today)
    duration = Column(Integer, nullable=True)
    
    # Relationships
    sections = relationship("WorkoutSection", back_populates="workout", cascade="all, delete-orphan")

class WorkoutSection(Base):
    __tablename__ = "workout_section"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    name = Column(String(255), nullable=False)
    position = Column(Integer, nullable=False)
    
    # Relationships
    workout = relationship("Workout", back_populates="sections")
    exercises = relationship("WorkoutExercise", secondary="section_exercises", back_populates="sections")

class WorkoutExercise(Base):
    __tablename__ = "workout_exercise"

    id = Column(Integer, primary_key=True, index=True)
    ex_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    sets = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False)
    rest = Column(Integer, nullable=False)
    position = Column(Integer, nullable=False)
    
    # Relationships
    sections = relationship("WorkoutSection", secondary="section_exercises", back_populates="exercises")

class SectionExercise(Base):
    __tablename__ = "section_exercises"

    section_id = Column(Integer, ForeignKey("workout_section.id"), primary_key=True)
    work_exercise_id = Column(Integer, ForeignKey("workout_exercise.id"), primary_key=True)
    position = Column(Integer, nullable=False)

# Pydantic models
class TagBase(BaseModel):
    name: str

class TagResponse(TagBase):
    id: int

    class Config:
        orm_mode = True

class ExerciseBase(BaseModel):
    name: str
    instructions: Optional[str] = None
    enrichment: Optional[str] = None
    videoUrl: Optional[str] = None
    crop_id: Optional[int] = None

class ExerciseCreate(ExerciseBase):
    tag_ids: Optional[List[int]] = None  # IDs of tags to associate with the exercise

class ExerciseUpdate(ExerciseBase):
    tag_ids: Optional[List[int]] = None  # IDs of tags to associate with the exercise

class ExerciseResponse(ExerciseBase):
    id: int
    tags: List[TagBase] = []
    
    class Config:
        orm_mode = True

class WorkoutExerciseBase(BaseModel):
    ex_id: str
    sets: int
    quantity: int
    unit: int
    duration: int
    rest: int
    position: int

class WorkoutExerciseCreate(WorkoutExerciseBase):
    pass

class WorkoutSectionBase(BaseModel):
    name: str
    position: int

class WorkoutSectionCreate(WorkoutSectionBase):
    pass

class WorkoutBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None

class WorkoutCreate(WorkoutBase):
    sections: List[WorkoutSectionCreate]

class WorkoutExerciseResponse(WorkoutExerciseBase):
    id: int
    
    class Config:
        orm_mode = True

class WorkoutSectionResponse(WorkoutSectionBase):
    id: int
    work_id: int
    
    class Config:
        orm_mode = True

class WorkoutResponse(WorkoutBase):
    id: int
    created_at: datetime.date
    sections: List[WorkoutSectionResponse]
    
    class Config:
        orm_mode = True

# Tags endpoints
@app.get("/api/tags", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    try:
        tags = db.query(Tag).all()
        return tags
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać tagów")

@app.post("/api/tags", response_model=TagBase, status_code=201)
def create_tag(tag: TagBase, db: Session = Depends(get_db)):
    try:
        db_tag = Tag(name=tag.name)
        db.add(db_tag)
        db.commit()
        db.refresh(db_tag)
        return db_tag
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się utworzyć tagu")

# Exercises endpoints
@app.get("/api/exercises", response_model=List[ExerciseResponse])
def get_exercises(db: Session = Depends(get_db)):
    try:
        exercises = db.query(Exercise).all()
        return exercises
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać ćwiczeń")

@app.post("/api/exercises", response_model=ExerciseResponse, status_code=201)
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

@app.get("/api/exercises/{exercise_id}", response_model=ExerciseResponse)
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

@app.put("/api/exercises/{exercise_id}", response_model=ExerciseResponse)
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

@app.delete("/api/exercises/{exercise_id}")
def delete_exercise(exercise_id: int, db: Session = Depends(get_db)):
    try:
        db_exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
        if not db_exercise:
            raise HTTPException(status_code=404, detail="Ćwiczenie nie zostało znalezione")
        
        db.delete(db_exercise)
        db.commit()
        return {"message": "Ćwiczenie zostało usunięte"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Nie udało się usunąć ćwiczenia: {str(e)}")

# Workouts endpoints
@app.get("/api/workouts", response_model=List[WorkoutResponse])
def get_workouts(db: Session = Depends(get_db)):
    try:
        workouts = db.query(Workout).all()
        return workouts
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch workouts")

@app.post("/api/workouts", response_model=WorkoutResponse, status_code=201)
def create_workout(workout: WorkoutCreate, db: Session = Depends(get_db)):
    try:
        # Validation
        if not workout.title:
            raise HTTPException(status_code=400, detail="Title is required and must be a string")
        
        if not hasattr(workout, 'sections') or not workout.sections:
            raise HTTPException(status_code=400, detail="Sections must be provided")
        
        # Create workout
        db_workout = Workout(
            title=workout.title,
            description=workout.description,
            duration=workout.duration,
            created_at=datetime.date.today()
        )
        db.add(db_workout)
        db.flush()  # To get workout ID
        
        # Create sections
        for section in workout.sections:
            db_section = WorkoutSection(
                work_id=db_workout.id,
                name=section.name,
                position=section.position
            )
            db.add(db_section)
        
        db.commit()
        db.refresh(db_workout)
        return db_workout
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create workout: {str(e)}")

@app.get("/api/workouts/{workout_id}", response_model=WorkoutResponse)
def get_workout(workout_id: int, db: Session = Depends(get_db)):
    try:
        workout = db.query(Workout).filter(Workout.id == workout_id).first()
        if not workout:
            raise HTTPException(status_code=404, detail="Workout not found")
        return workout
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch workout")

@app.put("/api/workouts/{workout_id}", response_model=WorkoutResponse)
def update_workout(workout_id: int, workout: WorkoutCreate, db: Session = Depends(get_db)):
    try:
        # Validation
        if not workout.title:
            raise HTTPException(status_code=400, detail="Title is required and must be a string")
        
        # Check if workout exists
        db_workout = db.query(Workout).filter(Workout.id == workout_id).first()
        if not db_workout:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        # Update workout
        db_workout.title = workout.title
        db_workout.description = workout.description
        db_workout.duration = workout.duration
        
        # Delete existing sections
        db.query(WorkoutSection).filter(WorkoutSection.work_id == workout_id).delete()
        
        # Create new sections
        for section in workout.sections:
            db_section = WorkoutSection(
                work_id=db_workout.id,
                name=section.name,
                position=section.position
            )
            db.add(db_section)
        
        db.commit()
        db.refresh(db_workout)
        return db_workout
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update workout: {str(e)}")

@app.delete("/api/workouts/{workout_id}")
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    try:
        db_workout = db.query(Workout).filter(Workout.id == workout_id).first()
        if not db_workout:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        db.delete(db_workout)
        db.commit()
        return {"message": "Workout deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete workout")

# Create tables
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)