import fs from 'node:fs';
import consoleStamp from 'console-stamp';
import * as Sentry from '@sentry/node';

if (fs.existsSync('.env'))
    process.loadEnvFile();

consoleStamp(console);

// Sentry error reporting
Sentry.init({ dsn: process.env.SENTRY_DSN });
