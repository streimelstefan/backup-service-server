const express = require('express');
const router = express.Router();
const config = require('../config');
const fs = require('fs')
const workers = require('../data/workers-safe');

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
        console.log('User wants to delete files from worker: ' + req.params.id);

        const filePath = config.projectLoaction + '/' + config.backupLocation + '/backup-' + id + '.zip';
        const dirPath = config.projectLoaction + '/' + config.backupLocation + '/back-' + id;

        if (fs.existsSync(fielPath) || fs.existsSync(dirPath)) {
            console.log('Files exist');

            fs.unlinkSync(filePath);
            rimraf.sync(dirPath);

            res.state(200).end();

        } else {
            console.error('Files were not found');
            res.status(403).end();
        }
    } else {
        console.error('The User is not authenticated');
        res.status(403).send('Please Authenticate first').end();
    }
});

module.exports = router;