from sqlalchemy.orm import Session
from typing import List
from ..models.disease import Disease
from ..schemas.disease import DiseaseCreate, DiseaseUpdate

class DiseaseService:
    def __init__(self, db: Session):
        self.db = db

    def get_disease(self, disease_id: int) -> Disease:
        return self.db.query(Disease).filter(Disease.id == disease_id).first()

    def get_all_diseases(self) -> List[Disease]:
        return self.db.query(Disease).all()

    def create_disease(self, disease: DiseaseCreate) -> Disease:
        db_disease = Disease(**disease.dict())
        self.db.add(db_disease)
        self.db.commit()
        self.db.refresh(db_disease)
        return db_disease

    def update_disease(self, disease_id: int, disease: DiseaseUpdate) -> Disease:
        db_disease = self.get_disease(disease_id)
        if db_disease:
            for key, value in disease.dict(exclude_unset=True).items():
                setattr(db_disease, key, value)
            self.db.commit()
            self.db.refresh(db_disease)
        return db_disease

    def delete_disease(self, disease_id: int) -> bool:
        db_disease = self.get_disease(disease_id)
        if db_disease:
            self.db.delete(db_disease)
            self.db.commit()
            return True
        return False