import * as express from 'express';
import Sentry = require('@sentry/node');
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
let configIn = require('./config');
let config = require('./classes/config.class');

config.setUser(configIn.user.id, configIn.user.pwd);
config.setScirpts(configIn.scripts);
config.setlogFilesLocation(configIn.logFilesLocation);
config.setBackupLocation(configIn.backupLocation);
config.setMinTimeOut(configIn.minWaitTime);
config.setRunsInLinux(configIn.runsInLinux);

console.log(JSON.stringify(config));

const authRouter = require('./routes/auth.route');
const scrpitRouter = require('./routes/scripts.route');
const workersRouter = require('./routes/workers.route');



const app = express();

Sentry.init({ dsn: 'https://4af2b64fb73e4f61b5324038ddc341cb@sentry.streimel.com/2' });

app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

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
app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);


// Optional fallthrough error handler
app.use(function onError(err: any, req: any, res: any, next: any) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + "\n");
    console.error(err);
});

export = app;
