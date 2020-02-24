const fs = require('fs-extra');
const config = require('../config');
const archiver = require('archiver');
const spawn = require('child_process').spawn;
const rimraf = require("rimraf");

class Worker {
    constructor(command, workerId, logOutPutDir, errOutPutDir, backupFilesLoc, useCopy, executingDir) {
        this.command = command;
        this.workerId = workerId;
        this.state = 'PASSIVE';
        this.logOutPutDir = logOutPutDir;
        this.errOutPutDir = errOutPutDir;
        this.backupFilesLoc = backupFilesLoc;
        this.useCopy = useCopy;
        this.executingDir = executingDir;
        this.child = null;
    }

    runWorker() {
        console.log(`[WORKER-${this.workerId}][LOG]: Setting up Worker.`);
        const out = fs.openSync(`${this.logOutPutDir}/out-${this.workerId}.log`, 'a');
        const err = fs.openSync(`${this.errOutPutDir}/errout-${this.workerId}.log`, 'a');

        this.state = 'RUNNING';

        let executingDir = undefined;
        if (this.executingDir) {
            executingDir = this.executingDir;
        }

        console.log(`[WORKER-${this.workerId}][LOG]: Starting to run Worker`);

        this.child = spawn(this.command, [], {
            shell: process.env.ComSpec,
            detached: true,
            stdio: [ 'ignore', out, err ],
            cwd: executingDir
        });

        this.child.on('close', (code) => {
            this.finishExecution(code);
        });

    }

    finishExecution(code) {
        console.log(`[WORKER-${this.workerId}][LOG]: Worker finished with code ${code}`);

        // setting backup dir
        const location = config.projectLoaction + '/' + config.backupLocation + '/back-' + this.workerId;
        console.log(`[WORKER-${this.workerId}][LOG]: Backup-Location =  ${location}`);

        // check if a backup file location was set
        if (this.backupFilesLoc) {
            console.log(`[WORKER-${this.workerId}][LOG]: backup File Location specified need to move files.`);
            // move the backup files to the backup Location
            if (this.useCopy) {

                // copy the filloc dir to the backup dir
                fs.copy(this.backupFilesLoc, location, err => {
                    if(err) {
                        return console.error(`[WORKER-${this.workerId}][ERROR]: Error while coping dir:  ${err}`);
                    }

                    console.log(`[WORKER-${this.workerId}][LOG]: Copied backup files to backupLocation`);
                    this.archiveBackupData(location);
                    this.finishUp();
                });

            } else {
                // move the filloc dir to the backup dir
                fs.move(this.backupFilesLoc, location, err => {
                    if(err) {
                        return console.error(`[WORKER-${this.workerId}][ERROR]: Error while moving dir:  ${err}`);
                    }

                    console.log(`[WORKER-${this.workerId}][LOG]: Moved backup files to backupLocation`);
                    this.archiveBackupData(location);
                    this.finishUp();
                });
            }
        } else {
            this.archiveBackupData(location);
            this.finishUp();
        }
    }

    archiveBackupData(location) {
        console.log(`[WORKER-${this.workerId}][LOG]: Starting to Archive backup-data`);
        // Archiving the backup dir
        addDirToArchive(location, `${config.projectLoaction}/${config.backupLocation}/backup-${this.workerId}.zip`, `[WORKER-${this.workerId}]`);
    }

    finishUp() {
        this.state = 'SUCCESS';
        this.child.unref();
        console.log(`[WORKER-${this.workerId}][LOG]: Worker finished running.`);

        setTimeout(() => {
            console.log(`[WORKER-${this.workerId}][LOG]: Releasing Worker.`);
            this.state = 'PASSIVE'
        }, config.minWaitTime);
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
        console.error(`${preset}[ERROR][ARCHIVER]: error Archiving: ${err}`)
        throw err;
    });

    archive.pipe(output);
    archive.directory(dir, false);
    archive.finalize();
}

module.exports.Worker = Worker;
module.exports.workers = workers;