const express = require('express');
const router = express.Router();
const config = require('../config');
const fs = require('fs');
const workers = require('../classes/worker').workers;
const Worker = require('../classes/worker').Worker;


router.route('/:id/errorlog')
    .get((req, res) => {
        if (req.session.authenticated) {
            console.log('[ROUTE][LOG][v1/workers/:id/errorlog]: User is authenticated');
            console.log('[ROUTE][LOG][v1/workers/:id/errorlog]: User asking for filw of worker with id ' + req.params.id);
            const filePath = config.projectLoaction + `/${config.logFilesLocation}/errout-${req.params.id}.log`;
            console.log('[ROUTE][LOG][v1/workers/:id/errorlog]: Filepath: ' + filePath);

            if (fs.existsSync(filePath)) {

                res.sendFile(filePath, {
                    dotfiles: 'allow',
                });


            } else {
                console.error('[ROUTE][ERROR][v1/workers/:id/errorlog]: The asked for file was not found');
                res.status(404).send({desc: 'Logfile does not exist'}).end();
            }
        } else {
            console.error('[ROUTE][ERROR][v1/workers/:id/errorlog]: User is not authenticated');
            res.status(403).send({desc: 'Please authenticate first!'});
        }
    });

router.get('/:id/stdlog', (req, res) => {
    if (req.session.authenticated) {
        console.log('[ROUTE][LOG][v1/workers/:id/stdlog]: User is authenticated');
        console.log('[ROUTE][LOG][v1/workers/:id/stdlog]: User asking for filw of worker with id ' + req.params.id);
        const filePath = config.projectLoaction + `/${config.logFilesLocation}/out-${req.params.id}.log`;
        console.log('[ROUTE][LOG][v1/workers/:id/stdlog]: Filepath: ' + filePath);

        if (fs.existsSync(filePath)) {

            res.sendFile(filePath, {
                dotfiles: 'allow',
            });

        } else {
            console.error('[ROUTE][ERROR][v1/workers/:id/stdlog]: The asked for file was not found');
            res.status(404).send({desc: 'Logfile does not exist'}).end();
        }
    } else {
        console.error('[ROUTE][ERROR][v1/workers/:id/stdlog]: User is not authenticated');
        res.status(403).send({desc: 'Please authenticate first!'}).end();
    }
});

router.get('/:id/state', (req, res) => {
    if (req.session.authenticated) {
        console.log('[ROUTE][LOG][v1/workers/:id/state]: User is authenticated');
        const id = req.params.id
        console.log('[ROUTE][LOG][v1/workers/:id/state]: User asking for state of worker with id ' + id);

        if (id > workers.length - 1 || id < 0) {
            console.error('[ROUTE][ERROR][v1/workers/:id/state]: Worker not in the worker Array.');
            res.status(404).end();
        } else {
            res.status(200).send({state: workers[id].state}).end();
        }
    } else {
        console.error('[ROUTE][ERROR][v1/workers/:id/state]: User is not authenticated');
        res.status(403).send({desc: 'Please authenticate first!'}).end();
    }
});

router.get('/:id/getBackupFile', (req, res) => {
    if (req.session.authenticated) {
        console.log('[ROUTE][LOG][v1/workers/:id/getBackupFile]: User is authenticated');
        const id = req.params.id
        console.log('[ROUTE][LOG][v1/workers/:id/getBackupFile]: User asking for state of worker with id ' + id);

        const filePath = config.projectLoaction + '/' + config.backupLocation + '/backup-' + id + '.zip';
        console.log('[ROUTE][LOG][v1/workers/:id/getBackupFile]: FilePaht: ' + filePath);

        if (fs.existsSync(filePath)) {

            res.sendFile(filePath, {
                dotfiles: 'allow',
            });

        } else {
            console.error('[ROUTE][ERROR][v1/workers/:id/getBackupFile]: The asked for file, was not found');
            res.status(404).send({desc: 'Backupfile does not exist'}).end();
        }
    } else {
        console.error('[ROUTE][ERROR][v1/workers/:id/getBackupFile]: User is not authenticated');
        res.status(403).send({desc: 'Please authenticate first!'}).end();
    }
});

router.delete('/:id/backup', (req, res) => {
    if (req.session.authenticated) {
        const id = req.params.id;
        console.log('[ROUTE][LOG][v1/workers/:id/backup]: User wants to delete files from worker: ' + id);

        const filePath = config.projectLoaction + '/' + config.backupLocation + '/backup-' + id + '.zip';
        const dirPath = config.projectLoaction + '/' + config.backupLocation + '/back-' + id;

        if (fs.existsSync(filePath) || fs.existsSync(dirPath)) {
            console.log('[ROUTE][LOG][v1/workers/:id/backup]: Files exist');

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            if (fs.existsSync(dirPath)) {
                rimraf.sync(dirPath);
            }

            res.status(200).end();

        } else {
            console.error('[ROUTE][ERROR][v1/workers/:id/backup]: Files were not found');
            res.status(403).end();
        }
    } else {
        console.error('[ROUTE][ERROR][v1/workers/:id/backup]: The User is not authenticated');
        res.status(403).send('Please Authenticate first').end();
    }
});

router.post('/:id/restart', (req, res) => {
    if (req.session.authenticated) {
        console.log(`[ROUTE][LOG][v1/workers/:id/restart]: User wants to restart: ${req.params.id}`);
        console.log('[ROUTE][LOG][v1/workers/:id/restart]: Workers online: ' + workers.length);

        if (isNaN(req.params.id)) {
            res.status(400).send({desc: 'The id needs to be a number!'}).end();
        } else if (req.params.id > workers.length - 1) {
            console.error('[ROUTE][ERROR][v1/workers/:id/restart]: Max ammount of Worker ID = ' + workers.length - 1)
            res.status(400).send({desc: 'The id is higher than the highest id.'}).end();
        } else if (req.params.id < 0) {
            res.status(400).send({desc: 'The id needs to be positive'}).end();
        } else if (workers[req.params.id].state != 'PASSIVE') {
            console.error(`[ROUTE][ERROR][v1/workers/:id/restart]: The Worker that the user wants to restart is currently running or hasn't been released yet.`);
            res.status(425).send({desc: 'This worker is running right now or hasnt been released yet.'});
        } else {
            console.log(`[ROUTE][LOG][v1/workers/:id/restart]: Starting data: ${JSON.stringify(workers[req.params.id])}`);

            const id = req.params.id;

            console.log(`[ROUTE][LOG][v1/workers/:id/restart]: Restarting Worker with id: ${id}`);

            workers[id].runWorker();

            res.status(200).send({workerId: id, executing: workers[id].command}).end();
        }

    } else {
        console.error('[ROUTE][LOG][v1/workers/:id/restart]: The User is not authenticated');
        res.status(403).send('Please Authenticate first').end();
    }
});


module.exports = router;