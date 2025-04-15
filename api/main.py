from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from api import exercise, tag, workout, plan

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tag.router, prefix="/api/tags", tags=["tags"])
app.include_router(exercise.router, prefix="/api/exercises", tags=["exercises"])
app.include_router(workout.router, prefix="/api/workouts", tags=["workouts"])
app.include_router(plan.router, prefix="/api/plans", tags=["plans"])

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)