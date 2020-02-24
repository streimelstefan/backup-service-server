const express = require('express');
const router = express.Router();
const config = require('../config');
let workers = require('../classes/worker').workers;
const Worker = require('../classes/worker').Worker;

router.route('')
    .get((req, res) => {
        if (req.session.authenticated) {
            console.log('[ROUTE][LOG][v1/scripts]: The User is Authenticated');

            let data = [];

            for (let i = 0; i < config.scripts.length; i++) {
                data.push({id: i, ...config.scripts[i]});
            }

            res.status(200).send(data).end();
        } else {
            console.error('[ROUTE][ERROR][v1/scripts]: The User is not Authenticated');
            res.status(403).send({desc: 'Please Authenticate first'}).end();
        }
    });

router.get('/:id', (req, res) => {
    if (req.session.authenticated) {
        console.log(`[ROUTE][LOG][v1/scripts/:id]: User wants to request: ${req.params.id}`);

        if (isNaN(req.params.id)) {
            console.error('[ROUTE][ERROR][v1/scripts/:id]: User did not use a number as id.');
            res.status(400).send({desc: 'The id needs to be a number!'}).end();
        } else if (req.params.id > config.scripts.length - 1) {
            console.error('[ROUTE][ERROR][v1/scripts/:id]: User id is out of bounds');
            res.status(400).send({desc: 'The id is higher than the highest id.'}).end();
        } else if (req.params.id < 0) {
            console.error('[ROUTE][ERROR][v1/scripts/:id]: User id is negative.');
            res.status(400).send({desc: 'The id needs to be positive'}).end();
        } else {
            console.log(`[ROUTE][LOG][v1/scripts/:id]: Sending data: ${config.scripts[req.params.id]}`);
            res.status(200).send({id: req.params.id, ...config.scripts[req.params.id]}).end();
        }

    } else {
        console.error('[ROUTE][ERROR][v1/scripts/:id]: The User is not authenticated');
        res.status(403).send('Please Authenticate first').end();
    }
});

router.post('/:id/register', (req, res) => {
    console.log(req.cookies);
    if (req.session.authenticated) {
        console.log(`[ROUTE][LOG][v1/scripts/:id/register]: User wants to register: ${req.params.id}`);

        if (isNaN(req.params.id)) {
            console.error('[ROUTE][ERROR][v1/scripts/:id/register]: User did not use a number as id.');
            res.status(400).send({desc: 'The id needs to be a number!'}).end();
        } else if (req.params.id > config.scripts.length - 1) {
            console.error('[ROUTE][ERROR][v1/scripts/:id/register]: User id out of bounds.');
            res.status(400).send({desc: 'The id is higher than the highest id.'}).end();
        } else if (req.params.id < 0) {
            console.error('[ROUTE][ERROR][v1/scripts/:id/register]: User id is lower than 0');
            res.status(400).send({desc: 'The id needs to be positive'}).end();
        } else {
            console.log(`[ROUTE][LOG][v1/scripts/:id/register]: Starting data: ${JSON.stringify(config.scripts[req.params.id])}`);

            const id = workers.push(null) - 1;

            const command = config.scripts[req.params.id].script
                .replace('{{BACKUP_LOCATION}}', config.projectLoaction + '/' + config.backupLocation + '/back-' + id)
                .replace('{{BACKUP_FILE_NAME}}', `backup-${id}.back`);

            let backupLocation = null;
            if (config.scripts[req.params.id].outputDir) {
                backupLocation = config.scripts[req.params.id].outputDir;
            }


            workers[id] = new Worker(command, id, config.logFilesLocation,
                                     config.logFilesLocation, backupLocation,
                                     config.scripts[req.params.id].useCopy,
                                     config.scripts[req.params.id].executingDir,
                                     config.scripts[req.params.id].envirement);

            console.log(`[ROUTE][LOG][v1/scripts/:id/register]: Registered Worker: ${JSON.stringify(workers[id])}`);
            console.log(`[ROUTE][LOG][v1/scripts/:id/register]: Worker id: ${id}`);

            res.status(200).send({workerId: id, executing: command}).end();
        }

    } else {
        console.error('The User is not authenticated');
        res.status(403).send('Please Authenticate first').end();
    }
});

module.exports = router;