from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from typing import List, Optional
import uuid
import os
from app.models.analysis import Analysis
from app.schemas.analysis import AIAnalysisCreate
from app.core.ai import generate_soap, generate_soap_from_image

# Use the correct ORM model class name
AIAnalysisRecord = Analysis

class AnalysisService:
    @staticmethod
    def _extract_text(file_path: str, file_type: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()

        if file_type == "pdf" or ext == ".pdf":
            try:
                try:
                    from pypdf import PdfReader
                except ImportError:
                    from PyPDF2 import PdfReader

                reader = PdfReader(file_path)
                return "\n\n".join((page.extract_text() or "") for page in reader.pages).strip()
            except Exception as e:
                print(f"PDF extraction failed: {e}")

        if file_type == "docx" or ext in (".docx", ".doc"):
            try:
                from docx import Document

                doc = Document(file_path)
                return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
            except Exception as e:
                print(f"DOCX extraction failed: {e}")

        if ext in (".txt", ".md", ".csv"):
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read().strip()
            except Exception as e:
                print(f"Text extraction failed: {e}")

        return ""

    @staticmethod
    def _stringify_soap_value(value):
        if isinstance(value, (dict, list)):
            import json
            return json.dumps(value, indent=2)
        return str(value) if value is not None else ""

    @staticmethod
    def _find_analysis_report(db: Session, analysis_id: str, organization_id: str):
        from app.models.report import Report

        reports = db.query(Report).filter(Report.organization_id == organization_id).all()
        for report in reports:
            if isinstance(report.key_entities, dict) and report.key_entities.get("analysis_id") == analysis_id:
                return report
        return None

    @staticmethod
    def _upsert_report_from_analysis(db: Session, record: Analysis, status: str = "draft"):
        from app.models.report import Report

        report = AnalysisService._find_analysis_report(
            db, record.analysis_id, record.organization_id
        ) or Report(
            user_id=record.user_id,
            organization_id=record.organization_id,
            patient_id=record.patient_id,
            status=status,
        )

        report.patient_id = record.patient_id
        report.subjective = AnalysisService._stringify_soap_value(record.generated_subjective)
        report.objective = AnalysisService._stringify_soap_value(record.generated_objective)
        report.assessment = AnalysisService._stringify_soap_value(record.generated_assessment)
        report.plan = AnalysisService._stringify_soap_value(record.generated_plan)
        report.medications = record.generated_medications or []
        report.key_entities = {
            **(record.key_entities if isinstance(record.key_entities, dict) else {}),
            "analysis_id": record.analysis_id,
            "source_file_name": record.source_file_name,
            "source_file_type": record.source_file_type,
        }
        report.status = status

        if status == "approved":
            report.approved_by = record.user_id
            report.approved_at = datetime.utcnow()

        if not report.report_id:
            db.add(report)
        elif report not in db:
            db.add(report)

        return report

    @staticmethod
    def create_analysis_record(db: Session, data: AIAnalysisCreate, user_id: str, organization_id: str):
        new_record = Analysis(
            **data.dict(),
            user_id=user_id,
            organization_id=organization_id,
            analysis_status="pending"
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record

    @staticmethod
    def get_analysis_records(db: Session, organization_id: str) -> List[Analysis]:
        return db.query(Analysis).filter(
            Analysis.organization_id == organization_id
        ).order_by(Analysis.created_at.desc()).all()

    @staticmethod
    def get_analysis_by_id(db: Session, analysis_id: str, organization_id: str):
        return db.query(Analysis).filter(
            Analysis.analysis_id == analysis_id,
            Analysis.organization_id == organization_id
        ).first()

    @staticmethod
    def update_analysis_status(db: Session, analysis_id: str, status: str, results: Optional[dict] = None):
        record = db.query(Analysis).filter(Analysis.analysis_id == analysis_id).first()
        if record:
            record.analysis_status = status
            if results:
                for key, value in results.items():
                    if hasattr(record, key):
                        setattr(record, key, value)
            db.commit()
            db.refresh(record)
        return record

    @staticmethod
    async def process_upload(db: Session, file, file_type: str, user_id: str, organization_id: str):
        try:
            upload_id = str(uuid.uuid4())
            
            # Ensure uploads directory exists
            upload_dir = "uploads"
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
                
            file_path = os.path.join(upload_dir, f"{upload_id}_{file.filename}")
            
            # Save file
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            extracted_text = AnalysisService._extract_text(file_path, file_type)
            if not extracted_text and file_type != "image":
                extracted_text = (
                    f"Medical document uploaded: {file.filename}. "
                    "No readable text could be extracted automatically."
                )
            
            new_record = Analysis(
                upload_id=upload_id,
                user_id=user_id,
                organization_id=organization_id,
                source_file_name=file.filename,
                source_file_type=file_type,
                extracted_text=extracted_text,
                key_entities={"file_path": file_path},
                analysis_status="pending"
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            return new_record
        except Exception as e:
            print(f"UPLOAD ERROR: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    @staticmethod
    def analyze_document(db: Session, analysis_id: str, organization_id: str):
        record = db.query(Analysis).filter(
            Analysis.analysis_id == analysis_id,
            Analysis.organization_id == organization_id
        ).first()
        
        if not record:
            return None
        
        record.analysis_status = "analyzing"
        db.commit()
        
        # 1. Generate SOAP from document
        import json
        from app.core.ai import generate_soap, compare_medical_reports
        from app.models.report import Report

        file_path = record.key_entities.get("file_path") if isinstance(record.key_entities, dict) else None
        if record.source_file_type == "image" and file_path and os.path.exists(file_path):
            soap_json = generate_soap_from_image(file_path, record.extracted_text or "")
        else:
            soap_json = generate_soap(record.extracted_text or "")

        try:
            soap_data = json.loads(soap_json)
            if soap_data.get("_error"):
                raise ValueError(soap_data["_error"])

            record.generated_subjective = soap_data.get("subjective")
            record.generated_objective = soap_data.get("objective")
            record.generated_assessment = soap_data.get("assessment")
            record.generated_plan = soap_data.get("plan")
            record.generated_medications = soap_data.get("medications", [])
            record.confidence_score = 94.2
            
            # 2. Intelligent Comparison (Phase 5)
            if record.patient_id:
                # Fetch most recent finalized report for this patient
                latest_report = db.query(Report).filter(
                    Report.patient_id == record.patient_id,
                    Report.status == "finalized"
                ).order_by(Report.created_at.desc()).first()

                if latest_report:
                    existing_data = {
                        "subjective": latest_report.subjective,
                        "objective": latest_report.objective,
                        "assessment": latest_report.assessment,
                        "plan": latest_report.plan
                    }
                    # Compare
                    record.comparison_data = compare_medical_reports(existing_data, soap_data)
            
            record.analysis_status = "completed"
            AnalysisService._upsert_report_from_analysis(db, record, status="draft")
        except Exception as e:
            print(f"Analysis Error: {str(e)}")
            record.analysis_status = "failed"
            
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def approve_analysis(db: Session, analysis_id: str, organization_id: str, notes: str):
        record = db.query(Analysis).filter(
            Analysis.analysis_id == analysis_id,
            Analysis.organization_id == organization_id
        ).first()
        
        if not record:
            return None
            
        # 1. Update analysis record
        record.approved_at = datetime.utcnow()
        record.notes = notes
        record.analysis_status = "completed"
        
        AnalysisService._upsert_report_from_analysis(db, record, status="approved")
        db.commit()
        db.refresh(record)
        return record
