"""Build a standalone HTML certificate for browser viewing/printing."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from app.persistence.models.tables import LearnerCertificationResult, ValidationDocument

_TEMPLATE_PATH = (
    Path(__file__).resolve().parent.parent / "validation" / "templates" / "certificate.html"
)


def _render(template_text: str, context: dict[str, str]) -> str:
    html = template_text
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
    else:
        html = html.replace(
            "{{ 'result-success' if system_result == 'success' else 'result-failure' }}",
            "result-failure",
        )
        html = html.replace(
            "{{ 'VALIDÉ' if system_result == 'success' else 'NON VALIDÉ' }}",
            "NON VALIDÉ",
        )
    return html


def build_certificate_html(learner_name: str, doc: ValidationDocument) -> str:
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

    template_text = _TEMPLATE_PATH.read_text(encoding="utf-8")
    cert_html = _render(template_text, context)

    # Wrap in a page with print button and auto-print JS
    wrapper = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Certificat — {doc.scope_label}</title>
<style>
  body {{ margin: 0; background: #f3f4f6; }}
  .toolbar {{
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    padding: 12px; background: #1a365d; color: white;
  }}
  .toolbar button {{
    padding: 8px 24px; border: none; border-radius: 6px;
    font-size: 14px; font-weight: 600; cursor: pointer;
  }}
  .btn-print {{ background: #38a169; color: white; }}
  .btn-print:hover {{ background: #2f855a; }}
  .btn-close {{ background: #e53e3e; color: white; }}
  .btn-close:hover {{ background: #c53030; }}
  .cert-container {{
    margin: 72px auto 40px;
    width: 297mm; background: white;
    box-shadow: 0 4px 24px rgba(0,0,0,.15);
  }}
  @media print {{
    .toolbar {{ display: none !important; }}
    .cert-container {{ margin: 0; box-shadow: none; }}
    @page {{ size: A4 landscape; margin: 0; }}
  }}
</style>
</head>
<body>
  <div class="toolbar">
    <button class="btn-print" onclick="window.print()">🖨️ Imprimer</button>
    <button class="btn-close" onclick="window.close()">✕ Fermer</button>
  </div>
  <div class="cert-container">
    <iframe srcdoc='{cert_html.replace(chr(39), "&#39;").replace(chr(10), " ")}' 
            style="width:297mm;height:210mm;border:none;" 
            title="Certificat"></iframe>
  </div>
</body>
</html>"""
    return wrapper


def build_certificate_html_from_cert(learner_name: str, cert: LearnerCertificationResult) -> str:
    """Build certificate HTML when no ValidationDocument exists (direct cert creation)."""
    now = datetime.now(timezone.utc)
    awarded = cert.awarded_at or cert.updated_at or cert.created_at or now
    context = {
        "learner_name": learner_name,
        "scope_label": cert.title,
        "presence_percent": "100",
        "absence_count": "0",
        "system_result": "success",
        "validation_date": awarded.strftime("%d/%m/%Y"),
        "generation_date": now.strftime("%d/%m/%Y à %H:%M"),
        "doc_id": str(cert.id),
    }

    template_text = _TEMPLATE_PATH.read_text(encoding="utf-8")
    cert_html = _render(template_text, context)

    wrapper = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Certificat — {cert.title}</title>
<style>
  body {{ margin: 0; background: #f3f4f6; }}
  .toolbar {{
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    padding: 12px; background: #1a365d; color: white;
  }}
  .toolbar button {{
    padding: 8px 24px; border: none; border-radius: 6px;
    font-size: 14px; font-weight: 600; cursor: pointer;
  }}
  .btn-print {{ background: #38a169; color: white; }}
  .btn-print:hover {{ background: #2f855a; }}
  .btn-close {{ background: #e53e3e; color: white; }}
  .btn-close:hover {{ background: #c53030; }}
  .cert-container {{
    margin: 72px auto 40px;
    width: 297mm; background: white;
    box-shadow: 0 4px 24px rgba(0,0,0,.15);
  }}
  @media print {{
    .toolbar {{ display: none !important; }}
    .cert-container {{ margin: 0; box-shadow: none; }}
    @page {{ size: A4 landscape; margin: 0; }}
  }}
</style>
</head>
<body>
  <div class="toolbar">
    <button class="btn-print" onclick="window.print()">🖨️ Imprimer</button>
    <button class="btn-close" onclick="window.close()">✕ Fermer</button>
  </div>
  <div class="cert-container">
    <iframe srcdoc='{cert_html.replace(chr(39), "&#39;").replace(chr(10), " ")}'
            style="width:297mm;height:210mm;border:none;"
            title="Certificat"></iframe>
  </div>
</body>
</html>"""
    return wrapper
