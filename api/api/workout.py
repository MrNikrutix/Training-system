from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.workout import WorkoutResponse, WorkoutCreate
from models.workout import Workout, WorkoutSection, WorkoutExercise, SectionExercise
from typing import List
import datetime

router = APIRouter()

# Workouts endpoints
@router.get("/", response_model=List[WorkoutResponse])
def get_workouts(db: Session = Depends(get_db)):
    try:
        workouts = db.query(Workout).all()
        return workouts
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch workouts")

@router.get("/{workout_id}", response_model=WorkoutResponse)
def get_workout(workout_id: int, db: Session = Depends(get_db)):
    try:
        workout = db.query(Workout).filter(Workout.id == workout_id).first()
        if not workout:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        # Load sections with exercises
        for section in workout.sections:
            section.exercises = db.query(WorkoutExercise).join(
                SectionExercise, SectionExercise.work_exercise_id == WorkoutExercise.id
            ).filter(SectionExercise.section_id == section.id).all()
        
        return workout
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workout: {str(e)}")
    
@router.post("/", response_model=WorkoutResponse, status_code=201)
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
        
        # Create sections with exercises
        for section in workout.sections:
            db_section = WorkoutSection(
                work_id=db_workout.id,
                name=section.name,
                position=section.position
            )
            db.add(db_section)
            db.flush()  # To get section ID
            
            # Add exercises to section
            for position, exercise_data in enumerate(section.exercises):
                # Create workout exercise
                workout_exercise = WorkoutExercise(
                    ex_id=exercise_data.ex_id,
                    sets=exercise_data.sets,
                    quantity=exercise_data.quantity,
                    unit=exercise_data.unit,
                    duration=exercise_data.duration,
                    rest=exercise_data.rest,
                    position=exercise_data.position
                )
                db.add(workout_exercise)
                db.flush()  # To get workout_exercise ID
                
                # Create section-exercise relationship
                section_exercise = SectionExercise(
                    section_id=db_section.id,
                    work_exercise_id=workout_exercise.id,
                    position=position
                )
                db.add(section_exercise)
        
        db.commit()
        db.refresh(db_workout)
        return db_workout
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create workout: {str(e)}")

@router.put("/{workout_id}", response_model=WorkoutResponse)
def update_workout(workout_id: int, workout: WorkoutCreate, db: Session = Depends(get_db)):
    try:
        # Validation
        if not workout.title:
            raise HTTPException(status_code=400, detail="Title is required and must be a string")
        
        # Check if workout exists
        db_workout = db.query(Workout).filter(Workout.id == workout_id).first()
        if not db_workout:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        # Update workout basic info
        db_workout.title = workout.title
        db_workout.description = workout.description
        db_workout.duration = workout.duration
        
        # Get all section IDs for this workout
        section_ids = [section.id for section in db_workout.sections]
        
        # Get all workout_exercise IDs associated with these sections
        workout_exercise_ids = db.query(SectionExercise.work_exercise_id).filter(
            SectionExercise.section_id.in_(section_ids)
        ).all()
        workout_exercise_ids = [id[0] for id in workout_exercise_ids]
        
        # Delete section-exercise relationships
        db.query(SectionExercise).filter(SectionExercise.section_id.in_(section_ids)).delete(synchronize_session=False)
        
        # Delete workout exercises
        db.query(WorkoutExercise).filter(WorkoutExercise.id.in_(workout_exercise_ids)).delete(synchronize_session=False)
        
        # Delete existing sections
        db.query(WorkoutSection).filter(WorkoutSection.work_id == workout_id).delete(synchronize_session=False)
        
        # Create new sections with exercises
        for section in workout.sections:
            db_section = WorkoutSection(
                work_id=db_workout.id,
                name=section.name,
                position=section.position
            )
            db.add(db_section)
            db.flush()  # To get section ID
            
            # Add exercises to section
            for position, exercise_data in enumerate(section.exercises):
                # Create workout exercise
                workout_exercise = WorkoutExercise(
                    ex_id=exercise_data.ex_id,
                    sets=exercise_data.sets,
                    quantity=exercise_data.quantity,
                    unit=exercise_data.unit,
                    duration=exercise_data.duration,
                    rest=exercise_data.rest,
                    position=exercise_data.position
                )
                db.add(workout_exercise)
                db.flush()  # To get workout_exercise ID
                
                # Create section-exercise relationship
                section_exercise = SectionExercise(
                    section_id=db_section.id,
                    work_exercise_id=workout_exercise.id,
                    position=position
                )
                db.add(section_exercise)
        
        db.commit()
        db.refresh(db_workout)
        return db_workout
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update workout: {str(e)}")

@router.delete("/{workout_id}")
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    try:
        db_workout = db.query(Workout).filter(Workout.id == workout_id).first()
        if not db_workout:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        # The cascade delete should handle the removal of related sections
        # which should in turn delete section_exercises relationships
        # But let's handle workout exercises manually to be safe
        
        # Get all section IDs for this workout
        section_ids = [section.id for section in db_workout.sections]
        
        # Get all workout_exercise IDs associated with these sections
        workout_exercise_ids = db.query(SectionExercise.work_exercise_id).filter(
            SectionExercise.section_id.in_(section_ids)
        ).all() if section_ids else []
        workout_exercise_ids = [id[0] for id in workout_exercise_ids]
        
        # Delete workout exercises if any found
        if workout_exercise_ids:
            db.query(WorkoutExercise).filter(WorkoutExercise.id.in_(workout_exercise_ids)).delete(synchronize_session=False)
        
        # Now delete workout (this will cascade delete sections and section_exercises)
        db.delete(db_workout)
        db.commit()
        return {"message": "Workout deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete workout: {str(e)}")