from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.tag import Tag
from schemas.tag import TagBase, TagResponse
from typing import List

router = APIRouter()

# Tags endpoints
@router.get("/", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    try:
        tags = db.query(Tag).all()
        return tags
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się pobrać tagów")

@router.post("/", response_model=TagBase, status_code=201)
def create_tag(tag: TagBase, db: Session = Depends(get_db)):
    try:
        db_tag = Tag(name=tag.name)
        db.add(db_tag)
        db.commit()
        db.refresh(db_tag)
        return db_tag
    except Exception as e:
        raise HTTPException(status_code=500, detail="Nie udało się utworzyć tagu")