import mysql.connector
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Text, TIMESTAMP
from sqlalchemy.orm import relationship

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
    created_at = Column(Date, nullable=False)
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
    # Poprawiona definicja - zmieniamy String na Integer dla ex_id
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

def create_tables(username, password, host):
    # Utwórz bazę danych jeśli nie istnieje
    create_database(username, password, host)
    
    # Utwórz połączenie do bazy danych
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{username}:{password}@{host}/trainhub"
    print(f"Próba połączenia z bazą danych: mysql+pymysql://{username}:********@{host}/trainhub")
    
    # Najpierw spróbujmy usunąć istniejące tabele, aby uniknąć konfliktów
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    try:
        # Najpierw usuwamy tabele, jeśli istnieją
        try:
            Base.metadata.drop_all(engine)
            print("Istniejące tabele zostały usunięte.")
        except:
            print("Nie udało się usunąć istniejących tabel lub tabele nie istniały.")
        
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
    
    # Utwórz bazę danych i tabele
    create_tables(username, password, host)