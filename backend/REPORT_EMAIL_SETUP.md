# Scheduled report email

Add your email provider's SMTP settings to `backend/.env`:

```dotenv
REPORT_SMTP_HOST=smtp.your-provider.example
REPORT_SMTP_FROM=reports@your-domain.example
REPORT_SMTP_PORT=587
REPORT_SMTP_STARTTLS=true
REPORT_SMTP_USER=your-smtp-username
REPORT_SMTP_PASSWORD=your-smtp-password
```

Replace the example values with your provider's settings. Use an app password
if your provider requires one. Omit USER and PASSWORD only for a relay that
does not require authentication. This transport supports SMTP with STARTTLS;
use your provider's STARTTLS port, not an implicit TLS port.

The backend loads `backend/.env` regardless of the startup directory.
Restart the backend and any separate scheduler process after changing settings.
Process environment variables take precedence over `.env` values.

Check the next scheduled execution in Reports History for delivery status SENT.
Existing failed deliveries are not retried automatically. Generated reports
remain downloadable from History even when email delivery fails.
