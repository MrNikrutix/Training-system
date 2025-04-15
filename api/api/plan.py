# api/plan.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.plan import Plan, WeekPlan, WorkoutPlan
from schemas.plan import (
    PlanCreate, PlanResponse, PlanUpdate,
    WeekPlanCreate, WeekPlanResponse, WeekPlanUpdate,
    WorkoutPlanCreate, WorkoutPlanResponse, WorkoutPlanUpdate
)
from typing import List
import datetime

router = APIRouter()

# Plan endpoints
@router.post("/", response_model=PlanResponse, status_code=201)
def create_plan(plan: PlanCreate, db: Session = Depends(get_db)):
    try:
        db_plan = Plan(
            name=plan.name,
            event_date=plan.event_date
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        return db_plan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create plan: {str(e)}")

@router.get("/", response_model=List[PlanResponse])
def get_plans(db: Session = Depends(get_db)):
    try:
        plans = db.query(Plan).all()
        return plans
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch plans: {str(e)}")

@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    try:
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        return plan
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch plan: {str(e)}")

@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(plan_id: int, plan: PlanUpdate, db: Session = Depends(get_db)):
    try:
        db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not db_plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        # Update plan data
        if plan.name is not None:
            db_plan.name = plan.name
        if plan.event_date is not None:
            db_plan.event_date = plan.event_date
        
        db.commit()
        db.refresh(db_plan)
        return db_plan
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update plan: {str(e)}")

@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    try:
        db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not db_plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        db.delete(db_plan)
        db.commit()
        return {"message": "Plan deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete plan: {str(e)}")

# Week Plan endpoints
@router.post("/weeks", response_model=WeekPlanResponse, status_code=201)
def create_week_plan(week: WeekPlanCreate, db: Session = Depends(get_db)):
    try:
        # Check if plan exists
        plan = db.query(Plan).filter(Plan.id == week.plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        db_week = WeekPlan(
            plan_id=week.plan_id,
            position=week.position,
            notes=week.notes
        )
        db.add(db_week)
        db.commit()
        db.refresh(db_week)
        return db_week
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create week plan: {str(e)}")

@router.get("/weeks/{week_id}", response_model=WeekPlanResponse)
def get_week_plan(week_id: int, db: Session = Depends(get_db)):
    try:
        week = db.query(WeekPlan).filter(WeekPlan.id == week_id).first()
        if not week:
            raise HTTPException(status_code=404, detail="Week plan not found")
        return week
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch week plan: {str(e)}")

@router.put("/weeks/{week_id}", response_model=WeekPlanResponse)
def update_week_plan(week_id: int, week: WeekPlanUpdate, db: Session = Depends(get_db)):
    try:
        db_week = db.query(WeekPlan).filter(WeekPlan.id == week_id).first()
        if not db_week:
            raise HTTPException(status_code=404, detail="Week plan not found")
        
        # Update week data
        if week.position is not None:
            db_week.position = week.position
        if week.notes is not None:
            db_week.notes = week.notes
        
        db.commit()
        db.refresh(db_week)
        return db_week
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update week plan: {str(e)}")

@router.delete("/weeks/{week_id}")
def delete_week_plan(week_id: int, db: Session = Depends(get_db)):
    try:
        db_week = db.query(WeekPlan).filter(WeekPlan.id == week_id).first()
        if not db_week:
            raise HTTPException(status_code=404, detail="Week plan not found")
        
        db.delete(db_week)
        db.commit()
        return {"message": "Week plan deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete week plan: {str(e)}")

# Workout Plan endpoints
@router.post("/workouts", response_model=WorkoutPlanResponse, status_code=201)
def create_workout_plan(workout: WorkoutPlanCreate, db: Session = Depends(get_db)):
    try:
        # Check if week exists
        week = db.query(WeekPlan).filter(WeekPlan.id == workout.week_id).first()
        if not week:
            raise HTTPException(status_code=404, detail="Week plan not found")
        
        # Check if plan_id matches week's plan_id
        if week.plan_id != workout.plan_id:
            raise HTTPException(status_code=400, detail="Plan ID doesn't match week's plan ID")
        
        db_workout = WorkoutPlan(
            plan_id=workout.plan_id,
            week_id=workout.week_id,
            name=workout.name,
            description=workout.description,
            day_of_week=workout.day_of_week,
            completed=workout.completed,
            notes=workout.notes,
            work_id=workout.work_id
        )
        db.add(db_workout)
        db.commit()
        db.refresh(db_workout)
        return db_workout
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create workout plan: {str(e)}")

@router.get("/workouts/{workout_id}", response_model=WorkoutPlanResponse)
def get_workout_plan(workout_id: int, db: Session = Depends(get_db)):
    try:
        workout = db.query(WorkoutPlan).filter(WorkoutPlan.id == workout_id).first()
        if not workout:
            raise HTTPException(status_code=404, detail="Workout plan not found")
        return workout
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workout plan: {str(e)}")

@router.put("/workouts/{workout_id}", response_model=WorkoutPlanResponse)
def update_workout_plan(workout_id: int, workout: WorkoutPlanUpdate, db: Session = Depends(get_db)):
    try:
        db_workout = db.query(WorkoutPlan).filter(WorkoutPlan.id == workout_id).first()
        if not db_workout:
            raise HTTPException(status_code=404, detail="Workout plan not found")
        
            # --- POCZĄTEK ZMIAN ---
        if workout.week_id is not None:
            # Opcjonalnie: Sprawdź, czy docelowy tydzień istnieje i należy do tego samego planu
            target_week = db.query(WeekPlan).filter(WeekPlan.id == workout.week_id).first()
            if not target_week:
                raise HTTPException(status_code=404, detail=f"Target week with id {workout.week_id} not found")
            if target_week.plan_id != db_workout.plan_id:
                 raise HTTPException(status_code=400, detail="Cannot move workout to a week in a different plan")
            db_workout.week_id = workout.week_id # Aktualizuj week_id
         # --- KONIEC ZMIAN ---
        
        # Update workout data
        if workout.name is not None:
            db_workout.name = workout.name
        if workout.description is not None:
            db_workout.description = workout.description
        if workout.day_of_week is not None:
            db_workout.day_of_week = workout.day_of_week
        if workout.completed is not None:
            db_workout.completed = workout.completed
        if workout.notes is not None:
            db_workout.notes = workout.notes
        if workout.work_id is not None:
            db_workout.work_id = workout.work_id
        
        db.commit()
        db.refresh(db_workout)
        return db_workout
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update workout plan: {str(e)}")

@router.delete("/workouts/{workout_id}")
def delete_workout_plan(workout_id: int, db: Session = Depends(get_db)):
    try:
        db_workout = db.query(WorkoutPlan).filter(WorkoutPlan.id == workout_id).first()
        if not db_workout:
            raise HTTPException(status_code=404, detail="Workout plan not found")
        
        db.delete(db_workout)
        db.commit()
        return {"message": "Workout plan deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete workout plan: {str(e)}")

@router.get("/{plan_id}/weeks", response_model=List[WeekPlanResponse])
def get_plan_weeks(plan_id: int, db: Session = Depends(get_db)):
    try:
        # Check if plan exists
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        weeks = db.query(WeekPlan).filter(WeekPlan.plan_id == plan_id).order_by(WeekPlan.position).all()
        return weeks
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch plan weeks: {str(e)}")

@router.get("/weeks/{week_id}/workouts", response_model=List[WorkoutPlanResponse])
def get_week_workouts(week_id: int, db: Session = Depends(get_db)):
    try:
        # Check if week exists
        week = db.query(WeekPlan).filter(WeekPlan.id == week_id).first()
        if not week:
            raise HTTPException(status_code=404, detail="Week plan not found")
        
        workouts = db.query(WorkoutPlan).filter(WorkoutPlan.week_id == week_id).all()
        return workouts
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch week workouts: {str(e)}")