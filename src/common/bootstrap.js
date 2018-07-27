require('dotenv').config();
require('console-stamp')(console);
require('module-alias/register');

// Sentry error reporting
const raven = require('raven');
raven.config(process.env.SENTRY_DSN).install();
