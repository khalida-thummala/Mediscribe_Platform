from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.deps import get_db
from app.models.report import Report
from app.models.patient import Patient
from app.models.user import User
from app.core.deps import get_current_user
from app.services.export_service import ExportService
import io

router = APIRouter()


@router.post("/{report_id}/export")
def export_report(
    report_id: str,
    data: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    report = db.query(Report).filter(
        Report.report_id == report_id,
        Report.organization_id == current_user.organization_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    doctor = db.query(User).filter(
        User.user_id == report.user_id
    ).first() or current_user

    patient = (
        db.query(Patient).filter(
            Patient.patient_id == report.patient_id
        ).first()
        if report.patient_id else None
    )

    if patient is None:

        class _StubPatient:

            full_name = "Unlinked Patient"

            first_name = "Unlinked"

            last_name = "Patient"

            patient_id = (
                report.patient_id or "N/A"
            )

        patient = _StubPatient()

    fmt = (
        data.get("format") or "pdf"
    ).lower()

    safe_id = report_id[:8]

    if fmt == "docx":

        file_bytes = (
            ExportService.generate_docx_bytes(
                report,
                doctor,
                patient
            )
        )

        media_type = (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

        filename = (
            f"SOAP_Report_{safe_id}.docx"
        )

    else:

        file_bytes = (
            ExportService.generate_pdf_bytes(
                report,
                doctor,
                patient
            )
        )

        media_type = "application/pdf"

        filename = (
            f"SOAP_Report_{safe_id}.pdf"
        )

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={
            "Content-Disposition":
            f'attachment; filename="{filename}"'
        },
    )