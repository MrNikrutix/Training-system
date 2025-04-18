import mysql.connector
from sqlalchemy import create_engine, Enum, MetaData, Table, Column, Integer, String, Boolean, ForeignKey, Date, Text, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import inspect
import enum
import datetime

# Pierwsze połączenie do MySQL aby utworzyć bazę danych
def create_database(user, password, host):
    try:
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password
        )
        print(f"Połączono z MySQL jako {user}")
        cursor = conn.cursor()
        cursor.execute("CREATE DATABASE IF NOT EXISTS trainhub")
        print("Baza danych 'trainhub' została utworzona lub już istnieje.")
        conn.close()
    except Exception as e:
        print(f"Błąd podczas tworzenia bazy danych: {e}")
        raise

# Definicje modeli SQLAlchemy
Base = declarative_base()

class DayOfWeek(str, enum.Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=True)
    enrichment = Column(Text, nullable=True)
    videoUrl = Column(String(255), nullable=True)
    crop_id = Column(Integer, nullable=True)
    
    tags = relationship("Tag", secondary="exercise_tags", back_populates="exercises")
    cropped_videos = relationship("CroppedVideo", back_populates="exercise")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    
    exercises = relationship("Exercise", secondary="exercise_tags", back_populates="tags")

class ExerciseTag(Base):
    __tablename__ = "exercise_tags"

    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    ex_id = Column(Integer, ForeignKey("exercises.id"), primary_key=True)

# Enumy
class ExerciseUnit(str, enum.Enum):
    TIME = "CZAS"
    QUANTITY = "ILOŚĆ"

# Workout (plan treningowy)
class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(Date, nullable=False, default=datetime.date.today)
    duration = Column(Integer, nullable=True)
    
    sections = relationship(
        "WorkoutSection",
        back_populates="workout",
        cascade="all, delete-orphan"
    )

# Sekcja w treningu
class WorkoutSection(Base):
    __tablename__ = "workout_section"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(Integer, ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    position = Column(Integer, nullable=False)
    
    workout = relationship("Workout", back_populates="sections")
    section_exercises = relationship(
        "SectionExercise",
        back_populates="section",
        cascade="all, delete-orphan"
    )
    exercises = relationship(
        "WorkoutExercise",
        secondary="section_exercises",
        back_populates="sections",
        overlaps="section_exercises,workout_exercise"
    )

# Ćwiczenie w treningu
class WorkoutExercise(Base):
    __tablename__ = "workout_exercise"

    id = Column(Integer, primary_key=True, index=True)
    ex_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    sets = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=True)
    unit = Column(Enum(ExerciseUnit), nullable=False)
    duration = Column(Integer, nullable=True)
    rest = Column(Integer, nullable=False)
    position = Column(Integer, nullable=False)
    
    section_exercises = relationship(
        "SectionExercise",
        back_populates="workout_exercise",
        cascade="all, delete-orphan"
    )
    sections = relationship(
        "WorkoutSection",
        secondary="section_exercises",
        back_populates="exercises",
        overlaps="section_exercises,section"
    )

# Powiązanie sekcji i ćwiczenia (wiele-do-wielu z dodatkowymi danymi)
class SectionExercise(Base):
    __tablename__ = "section_exercises"

    section_id = Column(Integer, ForeignKey("workout_section.id", ondelete="CASCADE"), primary_key=True)
    work_exercise_id = Column(Integer, ForeignKey("workout_exercise.id", ondelete="CASCADE"), primary_key=True)
    position = Column(Integer, nullable=False)

    section = relationship(
        "WorkoutSection",
        back_populates="section_exercises",
        overlaps="exercises,sections"
    )
    workout_exercise = relationship(
        "WorkoutExercise",
        back_populates="section_exercises",
        overlaps="sections,exercises"
    )

# NOWE MODELE DLA PLANÓW TRENINGOWYCH
class Plan(Base):
    __tablename__ = "plan"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    event_date = Column(Date, nullable=False)
    
    # Relationships
    weeks = relationship("WeekPlan", back_populates="plan", cascade="all, delete-orphan")
    workouts = relationship("WorkoutPlan", back_populates="plan", cascade="all, delete-orphan")

class WeekPlan(Base):
    __tablename__ = "week_plan"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plan.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    plan = relationship("Plan", back_populates="weeks")
    workouts = relationship("WorkoutPlan", back_populates="week", cascade="all, delete-orphan")

class WorkoutPlan(Base):
    __tablename__ = "workout_plan"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plan.id", ondelete="CASCADE"), nullable=False)
    week_id = Column(Integer, ForeignKey("week_plan.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    completed = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)
    work_id = Column(Integer, ForeignKey("workouts.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    plan = relationship("Plan", back_populates="workouts")
    week = relationship("WeekPlan", back_populates="workouts")
    workout = relationship("Workout", back_populates="workout_plans")

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
    crop_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    
    annotation = relationship("AnnotationAnalyser", back_populates="cropped_videos")

def create_tables(username, password, host):
    # Utwórz bazę danych jeśli nie istnieje
    create_database(username, password, host)
    
    # Utwórz połączenie do bazy danych
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{username}:{password}@{host}/trainhub"
    print(f"Próba połączenia z bazą danych: mysql+pymysql://{username}:********@{host}/trainhub")
    
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    try:
        # Najpierw usuwamy tabele, jeśli istnieją
        try:
            Base.metadata.drop_all(engine)
            print("Istniejące tabele zostały usunięte.")
        except Exception as e:
            print(f"Nie udało się usunąć istniejących tabel lub tabele nie istniały: {e}")
        
        # Teraz tworzymy tabele od nowa
        Base.metadata.create_all(engine)
        print("Wszystkie tabele zostały utworzone w bazie danych.")
    except Exception as e:
        print(f"Błąd podczas tworzenia tabel: {e}")


if __name__ == "__main__":
    # Podaj dane do połączenia MySQL
    username = input("Podaj nazwę użytkownika MySQL: ")
    password = input("Podaj hasło MySQL: ")
    
    # Sprawdź, czy hasło nie jest puste
    if not password:
        print("UWAGA: Wprowadzono puste hasło. Czy na pewno konto MySQL nie wymaga hasła?")
        confirm = input("Kontynuować? (tak/nie): ")
        if confirm.lower() != 'tak':
            print("Przerwano działanie skryptu.")
            exit()
    
    host = input("Podaj host MySQL (domyślnie localhost): ") or "localhost"

    create_tables(username, password, host)
    
