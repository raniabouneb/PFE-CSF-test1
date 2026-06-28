"""Génération de PDF (certificat / recommandation) via WeasyPrint."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
from app.persistence.models.tables import ValidationDocument

log = logging.getLogger(__name__)

_TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def _ensure_output_dir() -> Path:
    out = Path(settings.validation_docs_dir)
    out.mkdir(parents=True, exist_ok=True)
    return out


def _render(template_name: str, context: dict[str, str]) -> str:
    raw = (_TEMPLATES_DIR / template_name).read_text(encoding="utf-8")
    html = raw
    for key, value in context.items():
        html = html.replace("{{ " + key + " }}", value)
    if context.get("system_result") == "success":
        html = html.replace(
            "{{ 'result-success' if system_result == 'success' else 'result-failure' }}",
            "result-success",
        )
        html = html.replace(
            "{{ 'VALIDÉ' if system_result == 'success' else 'NON VALIDÉ' }}",
            "VALIDÉ",
        )
        html = html.replace(
            "{{ 'RECOMMANDÉ' if system_result == 'success' else 'NON RECOMMANDÉ' }}",
            "RECOMMANDÉ",
        )
    else:
        html = html.replace(
            "{{ 'result-success' if system_result == 'success' else 'result-failure' }}",
            "result-failure",
        )
        html = html.replace(
            "{{ 'VALIDÉ' if system_result == 'success' else 'NON VALIDÉ' }}",
            "NON VALIDÉ",
        )
        html = html.replace(
            "{{ 'RECOMMANDÉ' if system_result == 'success' else 'NON RECOMMANDÉ' }}",
            "NON RECOMMANDÉ",
        )
    return html


def generate_certificate_pdf(
    learner_name: str,
    doc: ValidationDocument,
) -> str:
    """Render certificate HTML -> PDF, return relative file path."""

    try:
        from weasyprint import HTML
    except ImportError:
        log.warning("weasyprint not installed — skipping PDF generation")
        return ""

    now = datetime.now(timezone.utc)
    context = {
        "learner_name": learner_name,
        "scope_label": doc.scope_label,
        "presence_percent": str(doc.presence_percent),
        "absence_count": str(doc.absence_count),
        "system_result": doc.system_result,
        "validation_date": (doc.reviewed_at or now).strftime("%d/%m/%Y"),
        "generation_date": now.strftime("%d/%m/%Y à %H:%M"),
        "doc_id": str(doc.id),
    }

    html_str = _render("certificate.html", context)
    out_dir = _ensure_output_dir()
    filename = f"cert_{doc.id}_{doc.member_id}.pdf"
    filepath = out_dir / filename

    HTML(string=html_str).write_pdf(str(filepath))
    log.info("Certificat PDF généré : %s", filepath)

    return str(filepath.relative_to(Path(settings.validation_docs_dir).parent))


def generate_recommendation_pdf(
    learner_name: str,
    doc: ValidationDocument,
) -> str:
    """Render recommendation HTML -> PDF, return relative file path."""

    try:
        from weasyprint import HTML
    except ImportError:
        log.warning("weasyprint not installed — skipping PDF generation")
        return ""

    now = datetime.now(timezone.utc)
    context = {
        "learner_name": learner_name,
        "scope_label": doc.scope_label,
        "presence_percent": str(doc.presence_percent),
        "test_score_percent": str(doc.test_score_percent if doc.test_score_percent is not None else "N/A"),
        "system_result": doc.system_result,
        "validation_date": (doc.reviewed_at or now).strftime("%d/%m/%Y"),
        "generation_date": now.strftime("%d/%m/%Y à %H:%M"),
        "doc_id": str(doc.id),
    }

    html_str = _render("recommendation.html", context)
    out_dir = _ensure_output_dir()
    filename = f"rec_{doc.id}_{doc.member_id}.pdf"
    filepath = out_dir / filename

    HTML(string=html_str).write_pdf(str(filepath))
    log.info("Recommandation PDF générée : %s", filepath)

    return str(filepath.relative_to(Path(settings.validation_docs_dir).parent))
