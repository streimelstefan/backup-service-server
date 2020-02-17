const express = require('express');
const Sentry = require('@sentry/node');
const cookieParser = require('cookie-parser');
const session = require('express-session')
let config = require('./config');

const authRouter = require('./routes/auth');
const scrpitRouter = require('./routes/scripts');
const workersRouter = require('./routes/workers');

const app = express();

Sentry.init({ dsn: 'https://4af2b64fb73e4f61b5324038ddc341cb@sentry.streimel.com/2' });

app.use(Sentry.Handlers.requestHandler());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    'secret': 'fdjakl12jklfjdaiphfvajnkl3brfjkdlahu3ez378uawiofh3UIRZHFAHBFDSA'
}));

app.use('/v1/auth', authRouter);
app.use('/v1/scripts', scrpitRouter);
app.use('/v1/workers', workersRouter);

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

config.projectLoaction = __dirname;

module.exports = app;
