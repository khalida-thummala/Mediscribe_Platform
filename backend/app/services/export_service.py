import io
import json
from datetime import datetime
from app.models.report import Report
from app.models.user import User
from app.models.patient import Patient

# PDF generation
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

# DOCX generation
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH


def _clean(text) -> str:
    """Convert any value to a clean readable string."""
    if text is None:
        return "N/A"
    if isinstance(text, (dict, list)):
        try:
            return json.dumps(text, indent=2)
        except Exception:
            return str(text)
    return str(text).strip() or "N/A"


class ExportService:

    @staticmethod
    def generate_pdf_bytes(report: Report, doctor: User, patient: Patient) -> bytes:
        """Generate a real PDF using reportlab and return raw bytes."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "Title", parent=styles["Heading1"],
            fontSize=18, textColor=colors.HexColor("#1a1a2e"),
            spaceAfter=4,
        )
        heading_style = ParagraphStyle(
            "SectionHead", parent=styles["Heading2"],
            fontSize=12, textColor=colors.HexColor("#7c3aed"),
            spaceBefore=12, spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "Body", parent=styles["Normal"],
            fontSize=10, leading=14,
            textColor=colors.HexColor("#374151"),
        )
        label_style = ParagraphStyle(
            "Label", parent=styles["Normal"],
            fontSize=9, textColor=colors.HexColor("#6b7280"),
        )

        timestamp = datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")
        patient_name = _clean(getattr(patient, "full_name", None) or
                               f"{getattr(patient, 'first_name', '')} {getattr(patient, 'last_name', '')}".strip())
        doctor_name = _clean(getattr(doctor, "full_name", None))
        license_no = _clean(getattr(doctor, "license_number", None))

        story = []

        # Header
        story.append(Paragraph("MediScribe", title_style))
        story.append(Paragraph("Clinical SOAP Report", styles["Heading2"]))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb")))
        story.append(Spacer(1, 0.3 * cm))

        # Meta table
        meta_data = [
            ["Report ID", report.report_id[:8].upper() + "..."],
            ["Status", (report.status or "draft").capitalize()],
            ["Generated", timestamp],
            ["Doctor", f"Dr. {doctor_name}  |  License: {license_no}"],
            ["Patient", patient_name],
        ]
        meta_table = Table(meta_data, colWidths=[4 * cm, 13 * cm])
        meta_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#6b7280")),
            ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#111827")),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 0.4 * cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))

        # SOAP sections
        sections = [
            ("S — Subjective", report.subjective),
            ("O — Objective", report.objective),
            ("A — Assessment", report.assessment),
            ("P — Plan", report.plan),
        ]
        for title, content in sections:
            story.append(Paragraph(title, heading_style))
            text = _clean(content)
            # Split on newlines to preserve formatting
            for line in text.split("\n"):
                line = line.strip()
                if line:
                    story.append(Paragraph(line, body_style))
            story.append(Spacer(1, 0.2 * cm))

        # Medications
        meds = report.medications
        if meds:
            story.append(Paragraph("Medications", heading_style))
            if isinstance(meds, list):
                for med in meds:
                    if isinstance(med, dict):
                        name = med.get("name", med.get("drug", str(med)))
                        dose = med.get("dose", med.get("dosage", ""))
                        freq = med.get("frequency", med.get("freq", ""))
                        line = f"• {name}"
                        if dose:
                            line += f"  {dose}"
                        if freq:
                            line += f"  ({freq})"
                        story.append(Paragraph(line, body_style))
                    else:
                        story.append(Paragraph(f"• {med}", body_style))
            else:
                story.append(Paragraph(_clean(meds), body_style))
            story.append(Spacer(1, 0.2 * cm))

        # Follow-up
        if report.follow_up_needed:
            story.append(Paragraph("Follow-Up", heading_style))
            days = report.follow_up_days
            fu_text = f"Follow-up required in {days} day(s)." if days else "Follow-up required."
            story.append(Paragraph(fu_text, body_style))
            story.append(Spacer(1, 0.2 * cm))

        # Footer
        story.append(Spacer(1, 0.5 * cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph(
            f"Digitally prepared by MediScribe AI Platform  •  {timestamp}",
            label_style
        ))

        doc.build(story)
        buffer.seek(0)
        return buffer.read()

    @staticmethod
    def generate_docx_bytes(report: Report, doctor: User, patient: Patient) -> bytes:
        """Generate a real DOCX using python-docx and return raw bytes."""
        doc = Document()

        # Page margins
        for section in doc.sections:
            section.top_margin = Cm(2)
            section.bottom_margin = Cm(2)
            section.left_margin = Cm(2.5)
            section.right_margin = Cm(2.5)

        timestamp = datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")
        patient_name = _clean(getattr(patient, "full_name", None) or
                               f"{getattr(patient, 'first_name', '')} {getattr(patient, 'last_name', '')}".strip())
        doctor_name = _clean(getattr(doctor, "full_name", None))
        license_no = _clean(getattr(doctor, "license_number", None))

        # Title
        title = doc.add_heading("MediScribe — Clinical SOAP Report", 0)
        title.alignment = WD_ALIGN_PARAGRAPH.LEFT
        title.runs[0].font.color.rgb = RGBColor(0x1a, 0x1a, 0x2e)

        doc.add_paragraph()

        # Meta info table
        table = doc.add_table(rows=5, cols=2)
        table.style = "Table Grid"
        meta_rows = [
            ("Report ID", report.report_id[:8].upper() + "..."),
            ("Status", (report.status or "draft").capitalize()),
            ("Generated", timestamp),
            ("Doctor", f"Dr. {doctor_name}  |  License: {license_no}"),
            ("Patient", patient_name),
        ]
        for i, (label, value) in enumerate(meta_rows):
            row = table.rows[i]
            row.cells[0].text = label
            row.cells[1].text = value
            row.cells[0].paragraphs[0].runs[0].bold = True
            row.cells[0].paragraphs[0].runs[0].font.color.rgb = RGBColor(0x6b, 0x72, 0x80)

        doc.add_paragraph()

        # SOAP sections
        sections = [
            ("S — Subjective", report.subjective),
            ("O — Objective", report.objective),
            ("A — Assessment", report.assessment),
            ("P — Plan", report.plan),
        ]
        for title_text, content in sections:
            h = doc.add_heading(title_text, level=2)
            h.runs[0].font.color.rgb = RGBColor(0x7c, 0x3a, 0xed)
            text = _clean(content)
            for line in text.split("\n"):
                line = line.strip()
                if line:
                    doc.add_paragraph(line)

        # Medications
        meds = report.medications
        if meds:
            h = doc.add_heading("Medications", level=2)
            h.runs[0].font.color.rgb = RGBColor(0x7c, 0x3a, 0xed)
            if isinstance(meds, list):
                for med in meds:
                    if isinstance(med, dict):
                        name = med.get("name", med.get("drug", str(med)))
                        dose = med.get("dose", med.get("dosage", ""))
                        freq = med.get("frequency", med.get("freq", ""))
                        line = name
                        if dose:
                            line += f"  {dose}"
                        if freq:
                            line += f"  ({freq})"
                        doc.add_paragraph(line, style="List Bullet")
                    else:
                        doc.add_paragraph(str(med), style="List Bullet")
            else:
                doc.add_paragraph(_clean(meds))

        # Follow-up
        if report.follow_up_needed:
            h = doc.add_heading("Follow-Up", level=2)
            h.runs[0].font.color.rgb = RGBColor(0x7c, 0x3a, 0xed)
            days = report.follow_up_days
            doc.add_paragraph(f"Follow-up required in {days} day(s)." if days else "Follow-up required.")

        # Footer
        doc.add_paragraph()
        footer_p = doc.add_paragraph(f"Digitally prepared by MediScribe AI Platform  •  {timestamp}")
        footer_p.runs[0].font.size = Pt(8)
        footer_p.runs[0].font.color.rgb = RGBColor(0x9c, 0xa3, 0xaf)

        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer.read()
