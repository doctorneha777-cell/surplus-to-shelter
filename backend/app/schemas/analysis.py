from pydantic import BaseModel
from typing import Optional

class AnalysisResult(BaseModel):
    crop_name: str
    health_status: str
    likely_disease: Optional[str] = None
    confidence_percentage: float
    severity: Optional[str] = None
    symptoms: Optional[str] = None
    recommendations: Optional[str] = None

class AnalysisRequest(BaseModel):
    image_url: str
    user_id: Optional[int] = None

class AnalysisResponse(BaseModel):
    result: AnalysisResult
    message: str
    success: bool