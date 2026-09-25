import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from app.core.config import Settings
from app.services.report_scheduler import deliver


class ReportEmailTest(unittest.TestCase):
    def test_default_dotenv_path_is_independent_of_working_directory(self):
        expected = Path(__file__).resolve().parents[1] / '.env'
        self.assertEqual(Settings.model_config['env_file'], expected)
        with tempfile.TemporaryDirectory() as directory:
            original = Path.cwd()
            try:
                os.chdir(directory)
                self.assertEqual(Settings.model_config['env_file'].resolve(), expected)
            finally:
                os.chdir(original)

    def test_dotenv_settings_used_for_delivery(self):
        with tempfile.TemporaryDirectory() as directory:
            env = Path(directory) / '.env'
            env.write_text(
                'REPORT_SMTP_HOST=smtp.example.com\n'
                'REPORT_SMTP_FROM=reports@example.com\n'
                'REPORT_SMTP_PORT=2525\n'
                'REPORT_SMTP_STARTTLS=true\n'
                'REPORT_SMTP_USER=reports\n'
                'REPORT_SMTP_PASSWORD=test-password\n',
                encoding='utf-8',
            )
            with patch.dict(os.environ, {}, clear=True):
                settings = Settings(_env_file=env)
        run = SimpleNamespace(
            name='Sales', report_type='sales',
            context={'period': 'September', 'company': 'Test'},
        )
        config = SimpleNamespace(
            name='Daily sales', format='CSV', recipients=['recipient@example.com'],
        )
        with (
            patch('app.services.report_scheduler.settings', settings),
            patch('app.services.report_scheduler.export', return_value=(b'sales', 'text/csv')),
            patch('app.services.report_scheduler.smtplib.SMTP') as transport,
        ):
            smtp = transport.return_value.__enter__.return_value
            smtp.send_message.return_value = {}
            deliver(run, config)
            transport.assert_called_once_with('smtp.example.com', 2525, timeout=30)
            smtp.starttls.assert_called_once()
            smtp.login.assert_called_once_with('reports', 'test-password')
            message = smtp.send_message.call_args.args[0]
            self.assertEqual(message['From'], 'reports@example.com')
            self.assertEqual(message['To'], 'recipient@example.com')
            self.assertEqual(next(message.iter_attachments()).get_payload(decode=True), b'sales')

    def test_missing_configuration_does_not_connect(self):
        with patch.dict(os.environ, {}, clear=True):
            settings = Settings(_env_file=None)
        with (
            patch('app.services.report_scheduler.settings', settings),
            patch('app.services.report_scheduler.smtplib.SMTP') as transport,
        ):
            with self.assertRaisesRegex(RuntimeError, 'REPORT_SMTP_HOST'):
                deliver(None, None)
            settings.REPORT_SMTP_HOST = 'smtp.example.com'
            settings.REPORT_SMTP_FROM = 'reports@example.com'
            settings.REPORT_SMTP_USER = 'reports'
            with self.assertRaisesRegex(RuntimeError, 'REPORT_SMTP_PASSWORD'):
                deliver(None, None)
            transport.assert_not_called()
