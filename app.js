const express = require('express');
const Sentry = require('@sentry/node');
const cookieParser = require('cookie-parser');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

Sentry.init({ dsn: 'https://4af2b64fb73e4f61b5324038ddc341cb@sentry.streimel.com/2' });

app.use(Sentry.Handlers.requestHandler());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/debug-sentry', function mainHandler(req, res) {
    throw new Error('My first Sentry error!');
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());


// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + "\n");
});

module.exports = app;
