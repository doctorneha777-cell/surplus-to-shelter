from pydantic import BaseModel
from typing import List, Optional

class DiseaseBase(BaseModel):
    name: str
    symptoms: List[str]
    causes: List[str]
    prevention: List[str]

class DiseaseCreate(DiseaseBase):
    pass

class Disease(DiseaseBase):
    id: int

    class Config:
        orm_mode = True