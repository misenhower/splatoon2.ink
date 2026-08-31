require('dotenv').config();
require('console-stamp')(console);
require('module-alias/register');

// Sentry error reporting
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
