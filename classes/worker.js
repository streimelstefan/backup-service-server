const fs = require('fs');
const config = require('../config');
const archiver = require('archiver');
const spawn = require('child_process').spawn;
const rimraf = require("rimraf");

class Worker {
    constructor(command, workerId, logOutPutDir, errOutPutDir, backupFilesLoc) {
        this.command = command;
        this.workerId = workerId;
        this.state = 'PASSIVE';
        this.logOutPutDir = logOutPutDir;
        this.errOutPutDir = errOutPutDir;
        this.backupFilesLoc = backupFilesLoc;
        this.child = null;
    }

    runWorker() {
        console.log(`[WORKER-${this.workerId}][LOG]: Setting up Worker.`);
        const out = fs.openSync(`${this.logOutPutDir}/out-${this.workerId}.log`, 'a');
        const err = fs.openSync(`${this.errOutPutDir}/errout-${this.workerId}.log`, 'a');

        this.state = 'RUNNING';

        console.log(`[WORKER-${this.workerId}][LOG]: Starting to run Worker`);

        this.child = spawn(this.command, [], {
            shell: process.env.ComSpec,
            detached: true,
            stdio: [ 'ignore', out, err ]
        });

        this.child.on('close', (code) => {
            console.log(`[WORKER-${this.workerId}][LOG]: Worker finished with code ${code}`);
            const location = config.projectLoaction + '/' + config.backupLocation + '/back-' + id;
            console.log(`[WORKER-${this.workerId}][LOG]: Backup-Location =  ${location}`);
            addDirToArchive(location, `${config.projectLoaction}/${config.backupLocation}/backup-${id}.zip`);
            this.state = 'SUCCESS';
            this.child.unref();
            console.log(`[WORKER-${this.workerId}][LOG]: Worker finished running.`);
        });

    }
}

workers = [];

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

module.exports.Worker = Worker;
module.exports.workers = workers;