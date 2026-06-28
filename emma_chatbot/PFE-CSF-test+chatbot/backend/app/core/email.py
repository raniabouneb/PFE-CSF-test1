"""Service d'envoi d'emails SMTP pour le Centre de Validation."""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

log = logging.getLogger(__name__)


def _build_validated_html(learner_name: str, doc_kind: str) -> str:
    kind_label = "certificat" if doc_kind == "certificate" else "lettre de recommandation"
    return f"""\
<html>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
  <div style="background:#1a365d;color:#fff;padding:24px;text-align:center">
    <h1 style="margin:0;font-size:22px">CSF Formation</h1>
  </div>
  <div style="padding:24px">
    <p>Bonjour <strong>{learner_name}</strong>,</p>
    <p>Nous avons le plaisir de vous informer que votre
       <strong>{kind_label}</strong> a été <span style="color:#38a169">validé ✓</span>.</p>
    <p>Vous pouvez le consulter et le télécharger depuis votre espace apprenant.</p>
    <p style="margin-top:32px">Cordialement,<br>L'équipe CSF Formation</p>
  </div>
  <div style="background:#f7fafc;padding:12px;text-align:center;font-size:12px;color:#718096">
    CSF — Centre de Services et de Formation
  </div>
</body>
</html>"""


def _build_rejected_html(learner_name: str, doc_kind: str, rejection_reason: str) -> str:
    kind_label = "certificat" if doc_kind == "certificate" else "lettre de recommandation"
    return f"""\
<html>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
  <div style="background:#1a365d;color:#fff;padding:24px;text-align:center">
    <h1 style="margin:0;font-size:22px">CSF Formation</h1>
  </div>
  <div style="padding:24px">
    <p>Bonjour <strong>{learner_name}</strong>,</p>
    <p>Votre demande de <strong>{kind_label}</strong> n'a pas été retenue.</p>
    <div style="background:#fff5f5;border-left:4px solid #e53e3e;padding:12px;margin:16px 0">
      <strong>Motif :</strong> {rejection_reason}
    </div>
    <p>Pour toute question, contactez votre responsable de formation.</p>
    <p style="margin-top:32px">Cordialement,<br>L'équipe CSF Formation</p>
  </div>
  <div style="background:#f7fafc;padding:12px;text-align:center;font-size:12px;color:#718096">
    CSF — Centre de Services et de Formation
  </div>
</body>
</html>"""


def send_validation_email(
    to_email: str,
    learner_name: str,
    doc_kind: str,
    status: str,
    rejection_reason: str | None = None,
) -> None:
    """Send a validation/rejection email. No-op when SMTP_HOST is empty (dev mode)."""

    if not settings.smtp_host:
        log.warning("SMTP_HOST non configuré — email non envoyé à %s", to_email)
        return

    if status == "validated":
        subject = "Votre certificat a été validé ✓" if doc_kind == "certificate" else "Votre document de formation a été validé ✓"
        html = _build_validated_html(learner_name, doc_kind)
    else:
        subject = "Décision sur votre document de formation"
        html = _build_rejected_html(learner_name, doc_kind, rejection_reason or "")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, [to_email], msg.as_string())
        log.info("Email envoyé à %s (sujet=%s)", to_email, subject)
    except Exception:
        log.exception("Échec envoi email à %s", to_email)
