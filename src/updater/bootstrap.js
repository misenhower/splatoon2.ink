require('dotenv').config();
require('console-stamp')(console);

// Sentry
if (process.env.SENTRY_DSN) {
    const raven = require('raven');
    raven.config(process.env.SENTRY_DSN).install();
}
