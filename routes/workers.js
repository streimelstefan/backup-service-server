const express = require('express');
const router = express.Router();
const config = require('../config');
const fs = require('fs')
const workers = require('../data/workers-safe');
const rimraf = require("rimraf");
const archiver = require('archiver');
const spawn = require('child_process').spawn;

router.route('/:id/errorlog')
    .get((req, res) => {
        //if (req.session.authenticated) {
        if (true) {
            console.log('User is authenticated');
            console.log('User asking for filw of worker with id ' + req.params.id);
            const filePath = config.projectLoaction + `/${config.logFilesLocation}/errout-${req.params.id}.log`;
            console.log('Filepath: ' + filePath);

            if (fs.existsSync(filePath)) {

                res.sendFile(filePath, {
                    dotfiles: 'allow',
                });


            } else {
                console.error('The asked for file was not found');
                res.status(404).send({desc: 'Logfile does not exist'}).end();
            }
        } else {
            console.error('User is not authenticated');
            res.status(403).send({desc: 'Please authenticate first!'});
        }
    });

router.get('/:id/stdlog', (req, res) => {
    if (req.session.authenticated) {
        console.log('User is authenticated');
        console.log('User asking for filw of worker with id ' + req.params.id);
        const filePath = config.projectLoaction + `/${config.logFilesLocation}/out-${req.params.id}.log`;
        console.log('Filepath: ' + filePath);

        if (fs.existsSync(filePath)) {

            res.sendFile(filePath, {
                dotfiles: 'allow',
            });

        } else {
            console.error('The asked for file was not found');
            res.status(404).send({desc: 'Logfile does not exist'}).end();
        }
    } else {
        console.error('User is not authenticated');
        res.status(403).send({desc: 'Please authenticate first!'}).end();
    }
});

router.get('/:id/state', (req, res) => {
    if (req.session.authenticated) {
        console.log('User is authenticated');
        const id = req.params.id
        console.log('User asking for state of worker with id ' + id);

        if (id > workers.length - 1) {
            res.status(404).end();
        } else {
            res.status(200).send({state: workers[id].state}).end();
        }
    } else {
        console.error('User is not authenticated');
        res.status(403).send({desc: 'Please authenticate first!'}).end();
    }
});

router.get('/:id/getBackupFile', (req, res) => {
    if (req.session.authenticated) {
        console.log('User is authenticated');
        const id = req.params.id
        console.log('User asking for state of worker with id ' + id);

        const filePath = config.projectLoaction + '/' + config.backupLocation + '/backup-' + id + '.zip';
        console.log('FilePaht: ' + filePath);

        if (fs.existsSync(filePath)) {

            res.sendFile(filePath, {
                dotfiles: 'allow',
            });

        } else {
            console.error('The asked for file, was not found');
            res.status(404).send({desc: 'Backupfile does not exist'}).end();
        }
    } else {
        console.error('User is not authenticated');
        res.status(403).send({desc: 'Please authenticate first!'}).end();
    }
});

router.delete('/:id/backup', (req, res) => {
    if (req.session.authenticated) {
        const id = req.params.id;
        console.log('User wants to delete files from worker: ' + id);

        const filePath = config.projectLoaction + '/' + config.backupLocation + '/backup-' + id + '.zip';
        const dirPath = config.projectLoaction + '/' + config.backupLocation + '/back-' + id;

        if (fs.existsSync(filePath) || fs.existsSync(dirPath)) {
            console.log('Files exist');

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            if (fs.existsSync(dirPath)) {
                rimraf.sync(dirPath);
            }

            res.status(200).end();

        } else {
            console.error('Files were not found');
            res.status(403).end();
        }
    } else {
        console.error('The User is not authenticated');
        res.status(403).send('Please Authenticate first').end();
    }
});

router.post('/:id/restart', (req, res) => {
    if (req.session.authenticated) {
        console.log(`User wants to restart: ${req.params.id}`);
        console.log('Workers online: ' + workers.length);

        if (isNaN(req.params.id)) {
            res.status(400).send({desc: 'The id needs to be a number!'}).end();
        } else if (req.params.id > workers.length - 1) {
            console.log('Max ammount of Worker ID = ' + workers.length - 1)
            res.status(400).send({desc: 'The id is higher than the highest id.'}).end();
        } else if (req.params.id < 0) {
            res.status(400).send({desc: 'The id needs to be positive'}).end();
        } else {
            console.log(`Starting data: ${JSON.stringify(workers[req.params.id])}`);

            const id = req.params.id;

            console.log(`Worker id: ${id}`);

            const out = fs.openSync(`${config.logFilesLocation}/out-${id}.log`, 'a');
            const err = fs.openSync(`${config.logFilesLocation}/errout-${id}.log`, 'a');

            workers[id].finished = false;
            workers[id].state = 'RUNNING';

            workers[id].child = spawn(workers[id].executing, [], {
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

            res.status(200).send({workerId: id, executing: workers[id].executing}).end();
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