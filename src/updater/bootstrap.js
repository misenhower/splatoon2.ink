require('dotenv').config();
require('console-stamp')(console);

// Sentry error reporting
const raven = require('raven');
raven.config(process.env.SENTRY_DSN).install();
