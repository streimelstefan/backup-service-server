declare function require(path: string): any;
const fs = require('fs-extra');
import config = require('../config');
import child_process = require('child_process');
import { workers } from 'cluster';
const zipper = require("zip-local");

export class Worker {

    private static wokers = new Array<Worker>(0);

    public command: string;
    public workerId: number;
    public state: 'PASSIVE' | 'RUNNING' | 'ERROR' | 'READY' | 'SUCCESS';
    public logOutPutDir: string;
    public errOutPutDir: string;
    public backupFilesLoc: string | null;
    public useCopy: boolean;
    public executingDir: string;
    public child: child_process.ChildProcess | null;
    public env: {key: string, value: string}[];

    constructor (
        command: string,
        workerId: number,
        logOutPutDir: string,
        errOutPutDir: string,
        backupFilesLoc: string | null,
        useCopy: boolean,
        executingDir: string,
        env: {key: string, value: string}[]
        )
    {
        this.command = command;
        this.workerId = workerId;
        this.state = 'PASSIVE';
        this.logOutPutDir = logOutPutDir;
        this.errOutPutDir = errOutPutDir;
        this.backupFilesLoc = backupFilesLoc;
        this.useCopy = useCopy;
        this.executingDir = executingDir;
        this.child = null;
        this.env = env;
    }

    runWorker() {
        console.log(`[WORKER-${this.workerId}][LOG]: Setting up Worker.`);
        if (!fs.existsSync(`${this.logOutPutDir}/out-${this.workerId}.log`)) {
            fs.createFileSync(`${this.logOutPutDir}/out-${this.workerId}.log`);
        }
        if (!fs.existsSync(`${this.errOutPutDir}/errout-${this.workerId}.log`)) {
            fs.createFileSync(`${this.errOutPutDir}/errout-${this.workerId}.log`);
        }

        // if the directory for the backup is not existent create it
        if (!fs.existsSync(this.backupFilesLoc)) {
            fs.mkdirSync(this.backupFilesLoc, { recursive: true });
        }

        const out = fs.openSync(`${this.logOutPutDir}/out-${this.workerId}.log`, 'a');
        const err = fs.openSync(`${this.errOutPutDir}/errout-${this.workerId}.log`, 'a');

        this.state = 'RUNNING';

        const env = this.getEnvirement();

        let executingDir = undefined;
        if (this.executingDir) {
            executingDir = this.executingDir;
        }

        let shell = process.env.ComSpec;
        if (config.runsInLinux) {
            shell = '/bin/sh';
        }

        console.log(`[WORKER-${this.workerId}][LOG]: Starting to run Worker`);

        this.child = child_process.spawn(this.command, [], {
            shell: shell,
            detached: true,
            stdio: [ 'ignore', out, err ],
            cwd: executingDir,
            env: env
        });

        this.child.on('close', (code) => {
            this.finishExecution(code);
        });

    }

    getEnvirement() {
        let env = process.env;

        if (this.env) {
            this.env.forEach(variable => {
                env[variable.key] = variable.value;
            });
        }

        return env
    }

    finishExecution(code: number) {
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
                fs.copy(this.backupFilesLoc, location, (err: any) => {
                    if(err) {
                        return console.error(`[WORKER-${this.workerId}][ERROR]: Error while coping dir:  ${err}`);
                    }

                    console.log(`[WORKER-${this.workerId}][LOG]: Copied backup files to backupLocation`);
                    this.archiveBackupData(location);
                    this.finishUp();
                });

            } else {
                // move the filloc dir to the backup dir
                fs.move(this.backupFilesLoc, location, (err: any) => {
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

    archiveBackupData(location: string) {
        console.log(`[WORKER-${this.workerId}][LOG]: Starting to Archive backup-data`);
        // Archiving the backup dir
        addDirToArchive(location, `${config.projectLoaction}/${config.backupLocation}/backup-${this.workerId}.zip`, `[WORKER-${this.workerId}]:`);
    }

    finishUp() {
        if (this.child) {
            this.state = 'SUCCESS';
            this.child.unref();
            console.log(`[WORKER-${this.workerId}][LOG]: Worker finished running.`);

            setTimeout(() => {
                console.log(`[WORKER-${this.workerId}][LOG]: Releasing Worker.`);
                this.state = 'PASSIVE'
            }, config.minWaitTime);
        } else {
            this.state = 'ERROR';
            console.error(`[WORKER-${this.workerId}][ERROR]: Child process was not found.`);
        }
    }

    public static addWorkerToList(worker: Worker): number {
        return Worker.wokers.push(worker) - 1;
    }

    public static getNewWorkerId(): number {
        return Worker.wokers.length;
    }

    public static getWorkerWithId(id: number): Worker {
        return Worker.wokers[id];
    }

    public static getWorkersListLength(): number {
        return Worker.wokers.length;
    }
}

function addDirToArchive(dir: string, backname: string, preset: string) {
    zipper.sync.zip(dir).compress().save(backname);
    console.log(`${preset} finished zipping`);
}
