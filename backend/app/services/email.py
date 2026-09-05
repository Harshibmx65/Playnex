import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger("playnex.email")

def generate_otp_email_html(name: str, otp_code: str) -> str:
    display_name = name.strip() if name else "Learner"
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Playnex Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070b14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" style="max-width: 560px; background-color: #0c1322; border: 1px solid #1c2b48; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid #17253f;">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 10px; vertical-align: middle;">
                    <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #00e5ff 0%, #0077ff 100%); display: inline-block; line-height: 38px; text-align: center; font-size: 20px; color: #000; font-weight: 900;">▶</div>
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">PLAY<span style="color: #00e5ff;">NEX</span></span>
                  </td>
                </tr>
              </table>
              <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8; font-family: monospace; letter-spacing: 0.5px;">DISTRACTION-FREE LEARNING PLATFORM</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff;">Verify your email address</h2>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong style="color: #00e5ff;">{display_name}</strong>,<br>
                Welcome to Playnex! Use the 6-digit verification code below to complete your registration and activate your account.
              </p>

              <!-- OTP Code Display -->
              <div style="background-color: #070b14; border: 2px dashed #00e5ff; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="display: block; font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; color: #00e5ff; margin-bottom: 8px;">YOUR VERIFICATION CODE</span>
                <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; font-family: monospace, Courier, monospace; color: #ffffff;">{otp_code}</span>
                <span style="display: block; font-size: 12px; color: #94a3b8; margin-top: 8px;">Valid for the next {settings.OTP_EXPIRE_MINUTES} minutes</span>
              </div>

              <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.5; color: #94a3b8;">
                If you did not attempt to register on Playnex, please disregard this email. Your email address remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #080d18; border-top: 1px solid #17253f; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; font-family: monospace;">
                © {settings.EMAILS_FROM_NAME} • Automated Security Dispatch
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

def _send_smtp_email_sync(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """Internal synchronous worker for sending SMTP email"""
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"] = to_email

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    if settings.SMTP_SSL:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
    return True

async def send_verification_otp(to_email: str, name: str, otp_code: str) -> dict:
    """
    Sends 6-digit OTP verification email to the user.
    If SMTP is configured in .env, sends via SMTP server.
    Otherwise, logs to terminal console for seamless local development.
    """
    subject = f"{otp_code} is your Playnex verification code"
    text_content = f"Hello {name},\n\nYour Playnex verification code is: {otp_code}\n\nThis code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.\n\nPlaynex Team"
    html_content = generate_otp_email_html(name, otp_code)

    # Check if SMTP is configured
    is_smtp_configured = bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)

    if is_smtp_configured:
        try:
            await asyncio.to_thread(_send_smtp_email_sync, to_email, subject, html_content, text_content)
            logger.info(f"Verification email dispatched to {to_email} via SMTP ({settings.SMTP_HOST})")
            return {"sent": True, "method": "smtp", "detail": f"Verification code emailed to {to_email}"}
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {str(e)}. Falling back to console output.")
            print_dev_otp_banner(to_email, otp_code, error=str(e))
            return {"sent": True, "method": "console_fallback", "detail": f"Verification code logged to console (SMTP error: {str(e)})"}
    else:
        # Development Console Mode
        print_dev_otp_banner(to_email, otp_code)
        return {"sent": True, "method": "console_dev", "detail": f"Verification code logged to server console (Configure SMTP in .env for real delivery)"}

def print_dev_otp_banner(to_email: str, otp_code: str, error: str = None):
    border = "=" * 60
    print(f"\n{border}")
    print(f" [PLAYNEX AUTH] EMAIL OTP VERIFICATION DISPATCH")
    print(f"{border}")
    print(f" Recipient: {to_email}")
    print(f" OTP Code : >>>  {otp_code}  <<<")
    print(f" Expires  : in {settings.OTP_EXPIRE_MINUTES} minutes")
    if error:
        print(f" Note     : SMTP attempt failed ({error}), code displayed above.")
    else:
        print(f" Note     : SMTP not configured. To send real emails, set SMTP_HOST,")
        print(f"            SMTP_USER, SMTP_PASSWORD in backend/.env")
    print(f"{border}\n")
