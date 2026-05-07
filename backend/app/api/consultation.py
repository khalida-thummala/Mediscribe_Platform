from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import UploadFile, File
import os

from app.db.deps import get_db
from app.models.consultation import Consultation
from app.models.report import Report
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationEnd,
    AudioMetadata
)
from app.core.deps import get_current_user
from app.core.roles import require_role
from app.core.ai import generate_soap
from app.core.speech import transcribe_audio
from app.services.consultation_service import ConsultationService
import json
import uuid

router = APIRouter()


# GET CONSULTATIONS
@router.get("")
def list_consultations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    limit: int = 10
):
    return ConsultationService.get_consultations(db, current_user.organization_id)

# CREATE CONSULTATION
@router.post("")
def create_consultation(
    data: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return ConsultationService.create_consultation(
        db, data, current_user.user_id, current_user.organization_id
    )

# GET SINGLE CONSULTATION
@router.get("/{consultation_id}")
def get_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    consultation = ConsultationService.get_consultation_by_id(
        db, consultation_id, current_user.organization_id
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation

# GET TRANSCRIPTION
@router.get("/{consultation_id}/transcription")
def get_transcription(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id,
        Consultation.organization_id == current_user.organization_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    return {
        "transcription_text": consultation.transcription_text,
        "transcription_status": consultation.transcription_status,
        "confidence_score": consultation.transcription_confidence
    }

# START CONSULTATION
@router.post("/{consultation_id}/start")
def start_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "practitioner"])
    )
):
    consultation = ConsultationService.start_consultation(
        db, consultation_id, current_user.organization_id
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    return {"message": "Consultation started"}

# END CONSULTATION


@router.post("/{consultation_id}/end")
async def end_consultation(
    consultation_id: str,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["admin", "practitioner"])
    )
):

    os.makedirs("uploads", exist_ok=True)

    file_path = f"uploads/{audio.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await audio.read())

    consultation = ConsultationService.end_consultation(
        db,
        consultation_id,
        current_user.organization_id,
        audio_file_path=file_path
    )

    if not consultation:
        raise HTTPException(
            status_code=404,
            detail="Consultation not found"
        )

    return {
        "consultation_id": consultation.consultation_id,
        "status": consultation.status,
        "transcription_status": consultation.transcription_status,
        "transcription_text": consultation.transcription_text
    }
@router.post("/{consultation_id}/generate-soap")
def generate_soap_endpoint(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    consultation = db.query(Consultation).filter(
        Consultation.consultation_id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # Check if report already exists
    existing_report = db.query(Report).filter(Report.consultation_id == consultation_id).first()
    if existing_report:
        db.delete(existing_report)
        db.commit()

    from app.core.ai import generate_soap, check_drug_interactions

    ai_output = generate_soap(
        consultation.transcription_text or consultation.chief_complaint or ""
    )

    try:
        soap = json.loads(ai_output)
        # Check interactions
        meds = soap.get("medications", [])
        interactions = check_drug_interactions(meds) if meds else []
    except Exception:
        raise HTTPException(status_code=500, detail="Invalid AI response")

    def stringify(val):
        if isinstance(val, (dict, list)):
            return json.dumps(val, indent=2)
        return str(val) if val is not None else ""

    report = Report(
        consultation_id=consultation_id,
        patient_id=consultation.patient_id,
        user_id=current_user.user_id,
        organization_id=current_user.organization_id,

        subjective=stringify(soap.get("subjective")),
        objective=stringify(soap.get("objective")),
        assessment=stringify(soap.get("assessment")),
        plan=stringify(soap.get("plan")),

        medications=soap.get("medications", []),
        key_entities={"interactions": interactions},
        follow_up_needed=soap.get("follow_up_needed", False),
        follow_up_days=soap.get("follow_up_days"),

        status="draft"
    )


    db.add(report)
    db.commit()
    db.refresh(report)

    return report

@router.get("/{consultation_id}/report")
def get_consultation_report(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    report = db.query(Report).filter(Report.consultation_id == consultation_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.put("/{consultation_id}/report")
def update_consultation_report(
    consultation_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    report = db.query(Report).filter(Report.consultation_id == consultation_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    for key, value in data.items():
        if hasattr(report, key):
            setattr(report, key, value)

    db.commit()
    db.refresh(report)
    return report

@router.post("/{consultation_id}/report/approve")
def approve_consultation_report(
    consultation_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    report = db.query(Report).filter(Report.consultation_id == consultation_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = "approved"
    report.approved_by = current_user.user_id
    report.approved_at = datetime.now(timezone.utc)

from app.services.export_service import ExportService
from app.models.patient import Patient
from app.models.user import User

@router.get("/{consultation_id}/export")
def export_consultation_report(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    report = db.query(Report).filter(Report.consultation_id == consultation_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    patient = db.query(Patient).filter(Patient.patient_id == report.patient_id).first()
    doctor = db.query(User).filter(User.user_id == report.user_id).first()
    
    if not patient or not doctor:
        raise HTTPException(status_code=404, detail="Incomplete report metadata")
        
    return ExportService.generate_pdf_report(report, doctor, patient)
    
@router.put("/{consultation_id}")
def update_consultation(
    consultation_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    updated = ConsultationService.update_consultation(
        db, consultation_id, current_user.organization_id, data
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return updated

@router.delete("/{consultation_id}")
def delete_consultation(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "practitioner"]))
):
    success = ConsultationService.delete_consultation(
        db, consultation_id, current_user.organization_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return {"message": "Consultation deleted"}