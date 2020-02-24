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
            const location = config.projectLoaction + '/' + config.backupLocation + '/back-' + this.workerId;
            console.log(`[WORKER-${this.workerId}][LOG]: Backup-Location =  ${location}`);
            addDirToArchive(location, `${config.projectLoaction}/${config.backupLocation}/backup-${this.workerId}.zip`, `[WORKER-${this.workerId}]`);
            this.state = 'SUCCESS';
            this.child.unref();
            console.log(`[WORKER-${this.workerId}][LOG]: Worker finished running.`);

            setTimeout(() => {
                console.log(`[WORKER-${this.workerId}][LOG]: Releasing Worker.`);
                this.state = 'PASSIVE'
            }, config.minWaitTime);
        });

    }
}

workers = [];

function addDirToArchive(dir, backname, preset) {
    var output = fs.createWriteStream(backname);
    var archive = archiver('zip');

    output.on('close', function () {
        console.log(`${preset}[LOG][ARCHIVER]: ${archive.pointer()} total bytes archived`);
        console.log(`${preset}[LOG][ARCHIVER]: archiver has been finalized and the output file descriptor has closed.`);
    });

    archive.on('error', function(err){
        console.error(`${preset}[LOG][ARCHIVER]: error Archiving: ${err}`)
        throw err;
    });

    archive.pipe(output);
    archive.directory(dir, false);
    archive.finalize();
}

module.exports.Worker = Worker;
module.exports.workers = workers;