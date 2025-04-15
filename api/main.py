from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from api import exercise, tag, workout, plan, analyser
import os
import shutil
from pathlib import Path
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tworzenie katalogu dla przesłanych plików, jeśli nie istnieje
UPLOAD_DIR = Path("../public/uploads")
try:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Utworzono katalog: {UPLOAD_DIR.absolute()}")
except Exception as e:
    print(f"Błąd podczas tworzenia katalogu: {str(e)}")
    # Alternatywna ścieżka, jeśli nie można utworzyć katalogu
    UPLOAD_DIR = Path("./uploads")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Utworzono alternatywny katalog: {UPLOAD_DIR.absolute()}")

# Montowanie katalogów jako statyczne
try:
    app.mount("/static", StaticFiles(directory="../public"), name="static")
    print("Zamontowano katalog ../public jako /static")
except Exception as e:
    print(f"Błąd podczas montowania katalogu ../public: {str(e)}")

# Montowanie alternatywnego katalogu uploads, jeśli używamy alternatywnej ścieżki
if not str(UPLOAD_DIR).endswith("public/uploads"):
    try:
        app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")
        print("Zamontowano katalog ./uploads jako /uploads")
    except Exception as e:
        print(f"Błąd podczas montowania katalogu ./uploads: {str(e)}")

# Include routers
app.include_router(tag.router, prefix="/api/tags", tags=["tags"])
app.include_router(exercise.router, prefix="/api/exercises", tags=["exercises"])
app.include_router(workout.router, prefix="/api/workouts", tags=["workouts"])
app.include_router(plan.router, prefix="/api/plans", tags=["plans"])
app.include_router(analyser.router, prefix="/api/analysers", tags=["analysers"])

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generowanie unikalnej nazwy pliku
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{os.urandom(8).hex()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Zapisywanie pliku
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Zwracanie URL do pliku
        if str(UPLOAD_DIR).endswith("public/uploads"):
            return {"url": f"/static/uploads/{unique_filename}"}
        else:
            # Jeśli używamy alternatywnej ścieżki
            return {"url": f"/uploads/{unique_filename}"}
    except Exception as e:
        print(f"Błąd podczas przesyłania pliku: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Nie udało się przesłać pliku: {str(e)}")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)