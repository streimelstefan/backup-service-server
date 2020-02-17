const express = require('express');
const router = express.Router();
const config = require('../config');
const spawn = require('child_process').spawn;
let workers = require('../data/workers-safe');
const fs = require('fs');
const archiver = require('archiver');

router.route('')
    .get((req, res) => {
        if (req.session.authenticated) {
            console.log('The User is Authenticated');

            let data = [];

            for (let i = 0; i < config.scripts.length; i++) {
                data.push({id: i, ...config.scripts[i]});
            }

            res.status(200).send(data).end();
        } else {
            console.error('The User is not Authenticated');
            res.status(403).send({desc: 'Please Authenticate first'}).end();
        }
    });

router.get('/:id', (req, res) => {
    if (req.session.authenticated) {
        console.log(`User wants to request: ${req.params.id}`);

        if (isNaN(req.params.id)) {
            res.status(400).send({desc: 'The id needs to be a number!'}).end();
        } else if (req.params.id > config.scripts.length - 1) {
            res.status(400).send({desc: 'The id is higher than the highest id.'}).end();
        } else if (req.params.id < 0) {
            res.status(400).send({desc: 'The id needs to be positive'}).end();
        } else {
            console.log(`Sending data: ${config.scripts[req.params.id]}`);
            res.status(200).send({id: req.params.id, ...config.scripts[req.params.id]}).end();
        }

    } else {
        console.error('The User is not authenticated');
        res.status(403).send('Please Authenticate first').end();
    }
});

router.post('/:id/start', (req, res) => {
    if (req.session.authenticated) {
        console.log(`User wants to start: ${req.params.id}`);

        if (isNaN(req.params.id)) {
            res.status(400).send({desc: 'The id needs to be a number!'}).end();
        } else if (req.params.id > config.scripts.length - 1) {
            res.status(400).send({desc: 'The id is higher than the highest id.'}).end();
        } else if (req.params.id < 0) {
            res.status(400).send({desc: 'The id needs to be positive'}).end();
        } else {
            console.log(`Starting data: ${JSON.stringify(config.scripts[req.params.id])}`);

            const id = workers.push({executing: ''}) - 1;

            const command = config.scripts[req.params.id].script
                .replace('{{BACKUP_LOCATION}}', config.projectLoaction + '/' + config.backupLocation + '/back-' + id)
                .replace('{{BACKUP_FILE_NAME}}', `backup-${id}.back`);

            workers[id].executing = command;

            console.log(`All Workers: ${JSON.stringify(workers)}`);
            console.log(`Worker id: ${id}`);

            const out = fs.openSync(`${config.logFilesLocation}/out-${id}.log`, 'a');
            const err = fs.openSync(`${config.logFilesLocation}/errout-${id}.log`, 'a');

            workers[id].finished = false;
            workers[id].state = 'RUNNING';

            workers[id].child = spawn(command, [], {
                shell: process.env.ComSpec,
                detached: true,
                stdio: [ 'ignore', out, err ]
            });

            workers[id].child.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                const location = config.projectLoaction + '/' + config.backupLocation + '/back-' + id;
                console.log('Location: ' + location);
                addDirToArchive(location, `${config.projectLoaction}/${config.backupLocation}/backup-${id}.zip`);
                workers[id].state = 'SUCCESS';
                workers[id].child.unref();
            });

            res.status(200).send({workerId: id, executing: command}).end();
        }

    } else {
        console.error('The User is not authenticated');
        res.status(403).send('Please Authenticate first').end();
    }
});


function addDirToArchive(dir, backname) {
    var output = fs.createWriteStream(backname);
    var archive = archiver('zip');

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    archive.on('error', function(err){
        throw err;
    });

    archive.pipe(output);
    archive.directory(dir, false);
    archive.finalize();
}

module.exports = router;