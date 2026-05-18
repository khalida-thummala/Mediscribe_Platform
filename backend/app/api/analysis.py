from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.deps import get_db
from app.schemas.analysis import AIAnalysisRecord, AIAnalysisCreate
from app.core.deps import get_current_user
from app.services.analysis_service import AnalysisService

router = APIRouter()

@router.post("", response_model=AIAnalysisRecord)
def create_analysis(
    data: AIAnalysisCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return AnalysisService.create_analysis_record(
        db, data, current_user.user_id, current_user.organization_id
    )

@router.get("", response_model=List[AIAnalysisRecord])
def get_analyses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return AnalysisService.get_analysis_records(db, current_user.organization_id)

@router.post("/upload", response_model=AIAnalysisRecord)
async def upload_document(
    file: UploadFile = File(...),
    file_type: str = Form(...),
    patient_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return await AnalysisService.process_upload(
        db, file, file_type, current_user.user_id, current_user.organization_id, patient_id=patient_id
    )

@router.post("/{analysis_id}/analyze", response_model=AIAnalysisRecord)
def analyze_document(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    analysis = AnalysisService.analyze_document(db, analysis_id, current_user.organization_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    return analysis

@router.post("/{analysis_id}/approve")
def approve_analysis(
    analysis_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    notes = data.get("notes", "")
    analysis = AnalysisService.approve_analysis(db, analysis_id, current_user.organization_id, notes)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    return analysis

@router.get("/{analysis_id}", response_model=AIAnalysisRecord)
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    analysis = AnalysisService.get_analysis_by_id(
        db, analysis_id, current_user.organization_id
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis