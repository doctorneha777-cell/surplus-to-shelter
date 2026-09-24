from fastapi import APIRouter, HTTPException
from typing import List
from ..models.disease import Disease
from ..services.disease_service import get_all_diseases, get_disease_by_id

router = APIRouter()

@router.get("/diseases", response_model=List[Disease])
async def read_diseases():
    diseases = await get_all_diseases()
    return diseases

@router.get("/diseases/{disease_id}", response_model=Disease)
async def read_disease(disease_id: int):
    disease = await get_disease_by_id(disease_id)
    if disease is None:
        raise HTTPException(status_code=404, detail="Disease not found")
    return disease