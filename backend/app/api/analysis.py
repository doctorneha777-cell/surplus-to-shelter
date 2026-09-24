from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.ai_scanner import analyze_image
from app.schemas.analysis import AnalysisResult

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_crop_image(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        # Process the image and get analysis results
        analysis_result = await analyze_image(file)
        return JSONResponse(content=analysis_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))