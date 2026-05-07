from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List
from app.models.consultation import Consultation
from app.schemas.consultation import ConsultationCreate

import hashlib
from app.services.audit_service import audit_service
from app.services.report_service import ReportService

class ConsultationService:
    @staticmethod
    def create_consultation(db: Session, data: ConsultationCreate, user_id: str, organization_id: str):
        try:
            new_consultation = Consultation(
                **data.dict(),
                user_id=user_id,
                organization_id=organization_id,
                status="pending"
            )
            db.add(new_consultation)
            db.commit()
            db.refresh(new_consultation)
            
            # Log audit event (failsafe)
            try:
                audit_service.log_event(
                    db, 
                    action="consultation_created", 
                    user_id=user_id, 
                    organization_id=organization_id, 
                    resource_id=new_consultation.consultation_id
                )
            except Exception as audit_err:
                print(f"Audit logging failed: {str(audit_err)}")
                
            return new_consultation
        except Exception as e:
            print(f"CRITICAL: Consultation creation failed! Error type: {type(e).__name__}, Message: {str(e)}")
            db.rollback()
            raise e

    @staticmethod
    def get_consultations(db: Session, organization_id: str) -> List[Consultation]:
        return db.query(Consultation).filter(
            Consultation.organization_id == organization_id
        ).order_by(Consultation.created_at.desc()).all()

    @staticmethod
    def get_consultation_by_id(db: Session, consultation_id: str, organization_id: str):
        return db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()

    @staticmethod
    def start_consultation(db: Session, consultation_id: str, organization_id: str):
        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()
        
        if consultation:
            consultation.status = "in_progress"
            consultation.started_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(consultation)
            audit_service.log_event(db, action="consultation_started", user_id=consultation.user_id, organization_id=organization_id, resource_id=consultation_id)
        return consultation
    @staticmethod
    def end_consultation(
        db: Session,
        consultation_id: str,
        organization_id: str,
        audio_file_path: str
    ):

        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()

        if not consultation:
            return None

        consultation.status = "processing"

        consultation.ended_at = datetime.now(timezone.utc)

        # Duration
        if consultation.started_at:

            delta = (
                consultation.ended_at -
                consultation.started_at
            )

            consultation.duration_minutes = int(
                delta.total_seconds() / 60
            )

        try:

            # Save audio path
            consultation.audio_file_id = audio_file_path

            # Generate checksum
            with open(audio_file_path, "rb") as f:

                raw_audio = f.read()

            checksum = hashlib.sha256(
                raw_audio
            ).hexdigest()

            consultation.audio_checksum = checksum


            # =========================
            # WHISPER TRANSCRIPTION
            # =========================

            from app.core.speech import transcribe_audio

            result = transcribe_audio(
                audio_file_path
            )

            print("TRANSCRIPTION RESULT:", result)

            consultation.transcription_text = (
                result["text"]
            )

            consultation.transcription_status = (
                result["status"]
            )

            consultation.transcription_confidence = (
                result["confidence"]
            )


            # =========================
            # SOAP GENERATION
            # =========================

            if result["status"] == "completed":

                from app.core.ai import (
                    generate_soap,
                    check_drug_interactions
                )

                from app.models.report import Report

                import json

                print("GENERATING SOAP...")

                ai_output = generate_soap(
                    consultation.transcription_text or ""
                )

                print("AI OUTPUT:", ai_output)

                try:

                    soap = json.loads(ai_output)

                    print("SOAP PARSED SUCCESSFULLY")

                except Exception as e:

                    print("JSON ERROR:", str(e))

                    print("RAW AI OUTPUT:")
                    print(ai_output)

                    consultation.status = "failed"

                    db.commit()

                    return consultation
                meds = soap.get(
                    "medications",
                    []
                )

                interactions = (
                    check_drug_interactions(meds)
                    if meds else []
                )


                # =========================
                # CREATE REPORT
                # =========================

                report = Report(

                    consultation_id=
                        consultation.consultation_id,

                    patient_id=
                        consultation.patient_id,

                    user_id=
                        consultation.user_id,

                    organization_id=
                        organization_id,


                    subjective=str(
                        soap.get(
                            "subjective",
                            ""
                        )
                    ),

                    objective=str(
                        soap.get(
                            "objective",
                            ""
                        )
                    ),

                    assessment=str(
                        soap.get(
                            "assessment",
                            ""
                        )
                    ),

                    plan=str(
                        soap.get(
                            "plan",
                            ""
                        )
                    ),

                    medications=meds,

                    key_entities={
                        "interactions": interactions
                    },

                    follow_up_needed=soap.get(
                        "follow_up_needed",
                        False
                    ),

                    follow_up_days=soap.get(
                        "follow_up_days"
                    ),

                    status="draft"
                )

                db.add(report)
                print("REPORT ADDED")

                consultation.status = "completed"

                print("SOAP REPORT SAVED")

            else:

                consultation.status = (
                    "failed_transcription"
                )

        except Exception as e:

            print(
                f"END CONSULTATION ERROR: {str(e)}"
            )

            consultation.status = "failed"

        db.commit()
        print("REPORT SAVED")
        db.refresh(consultation)

        return consultation
    
    @staticmethod
    def update_consultation(db: Session, consultation_id: str, organization_id: str, data: dict):
        consultation = db.query(Consultation).filter(
            Consultation.consultation_id == consultation_id,
            Consultation.organization_id == organization_id
        ).first()
        
        if not consultation:
            return None
            
        for key, value in data.items():
            if hasattr(consultation, key):
                setattr(consultation, key, value)
        
        db.commit()
        db.refresh(consultation)
        return consultation

    @staticmethod
    def delete_consultation(
        db: Session,
        consultation_id: str,
        organization_id: str
    ):

        try:

            print("CONSULTATION ID:", consultation_id)
            print("ORGANIZATION ID:", organization_id)

            consultation = db.query(Consultation).filter(
                Consultation.consultation_id == consultation_id,
                Consultation.organization_id == organization_id
            ).first()

            print("FOUND CONSULTATION:", consultation)

            if not consultation:
                return False

            db.delete(consultation)
            db.commit()

            print("DELETE SUCCESS")

            return True

        except Exception as e:
            db.rollback()
            print("DELETE ERROR:", e)
            return False