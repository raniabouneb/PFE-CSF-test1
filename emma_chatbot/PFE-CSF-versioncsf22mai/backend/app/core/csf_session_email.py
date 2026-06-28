"""E-mails CSF brandés pour les séances planifiées (complément Google Calendar)."""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

log = logging.getLogger(__name__)


def _logo_url() -> str:
    base = (getattr(settings, "frontend_public_url", None) or "http://localhost:3001").rstrip("/")
    return f"{base}/images/logo-csf.png"


def build_session_scheduled_html(
    *,
    learner_name: str,
    session_title: str,
    module_label: str | None,
    date_label: str,
    time_label: str,
    location: str | None,
    group_label: str | None,
) -> str:
    module_line = (
        f'<p style="margin:0 0 8px;color:#475569;font-size:14px"><strong>Module :</strong> {module_label}</p>'
        if module_label
        else ""
    )
    group_line = (
        f'<p style="margin:0 0 8px;color:#475569;font-size:14px"><strong>Session :</strong> {group_label}</p>'
        if group_label
        else ""
    )
    loc = location.strip() if location else "À préciser"
    dashboard = (getattr(settings, "frontend_public_url", None) or "http://localhost:3001").rstrip("/")
    return f"""\
<html>
<body style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;background:#f1f5f9;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08)">
    <div style="background:linear-gradient(135deg,#0D3570 0%,#008080 100%);padding:28px 24px;text-align:center">
      <img src="{_logo_url()}" alt="CSF Formation" width="120" style="display:block;margin:0 auto 12px;height:auto" />
      <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85)">Centre de Services et de Formation</p>
    </div>
    <div style="padding:28px 24px">
      <p style="margin:0 0 16px;font-size:15px">Bonjour <strong>{learner_name}</strong>,</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.5">
        Une nouvelle <strong>séance CSF</strong> a été planifiée pour vous. Retrouvez-la dans
        <em>Prochaines séances CSF</em> et dans la cloche de notifications.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;margin-bottom:20px">
        <p style="margin:0 0 10px;font-size:17px;font-weight:700;color:#0D3570">{session_title}</p>
        {module_line}
        {group_line}
        <p style="margin:0 0 8px;color:#475569;font-size:14px"><strong>Date :</strong> {date_label}</p>
        <p style="margin:0 0 8px;color:#475569;font-size:14px"><strong>Horaire :</strong> {time_label}</p>
        <p style="margin:0;color:#475569;font-size:14px"><strong>Lieu :</strong> {loc}</p>
      </div>
      <p style="margin:0 0 20px;font-size:13px;color:#64748b;line-height:1.5">
        Une invitation <strong>Google Calendar</strong> peut aussi vous parvenir par e-mail (rappels Google en parallèle).
      </p>
      <a href="{dashboard}/dashboard" style="display:inline-block;background:#008080;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:8px">
        Ouvrir mon espace CSF
      </a>
      <p style="margin:28px 0 0;font-size:13px;color:#64748b">Cordialement,<br><strong>L'équipe CSF Formation</strong></p>
    </div>
    <div style="background:#f8fafc;padding:14px 20px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0">
      CSF — Centre de Services et de Formation
    </div>
  </div>
</body>
</html>"""


def send_session_scheduled_email(to_email: str, subject: str, html: str) -> None:
    if not settings.smtp_host:
        log.info("SMTP non configuré — e-mail CSF séance non envoyé à %s", to_email)
        return
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
        log.info("E-mail CSF séance envoyé à %s", to_email)
    except Exception:
        log.exception("Échec envoi e-mail CSF séance à %s", to_email)
