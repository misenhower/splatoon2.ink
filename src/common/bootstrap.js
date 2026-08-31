const fs = require('node:fs');

if (fs.existsSync('.env'))
    process.loadEnvFile();

require('console-stamp')(console);
require('module-alias/register');

// Sentry error reporting
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
