"""SMTP delivery for verification codes and HR notices.

Failures are logged, never raised — email must not be able to roll back an
otherwise successful HR transaction.
"""
import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger("dayflow.mail")
settings = get_settings()


def send_email(to: str, subject: str, body: str) -> bool:
    if not settings.smtp_host or not settings.smtp_user:
        logger.info("SMTP not configured; skipping mail to %s (%s)", to, subject)
        return False
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
        return True
    except Exception:  # pragma: no cover - transport failures are non-fatal
        logger.exception("Failed to send mail to %s", to)
        return False


def send_verification_code(to: str, code: str) -> None:
    send_email(
        to,
        "Verify your Dayflow account",
        f"Your Dayflow verification code is {code}. It expires in 24 hours.",
    )
