declare function require(path: string): any;
const fs = require('fs-extra');
import config = require('../classes/config.class');
import child_process = require('child_process');
const zipper = require("zip-local");

export class SubWorker {

    public command: string;
    public workerId: number;
    public state: 'RUNNING' | 'ERROR' | 'SUCCESS';
    public logOutPutDir: string;
    public errOutPutDir: string;
    public backupFilesLoc: string | null;
    public useCopy: boolean;
    public executingDir: string;
    public child: child_process.ChildProcess | null;
    public env: {key: string, value: string}[];
    public step: number;

    constructor (
        command: string,
        workerId: number,
        logOutPutDir: string,
        errOutPutDir: string,
        backupFilesLoc: string | null,
        useCopy: boolean,
        executingDir: string,
        env: {key: string, value: string}[],
        step: number
        )
    {
        this.command = command;
        this.workerId = workerId;
        this.state = 'SUCCESS';
        this.logOutPutDir = logOutPutDir;
        this.errOutPutDir = errOutPutDir;
        this.backupFilesLoc = backupFilesLoc;
        this.useCopy = useCopy;
        this.executingDir = executingDir;
        this.child = null;
        this.env = env;
        this.step = step;
    }

    runWorker(): Promise<string> {
        return new Promise<string>((res, rej) => {

            console.log(`[WORKER-${this.workerId}][STEP-${this.step}][LOG]: Setting up Worker.`);
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
            
            const env = this.getEnvirement();
            
            let executingDir = undefined;
            if (this.executingDir) {
                executingDir = this.executingDir;
            }
            
            let shell = process.env.ComSpec;
            if (config.runsInLinux) {
                shell = '/bin/sh';
            }
            
            console.log(`[WORKER-${this.workerId}][STEP-${this.step}][LOG]: Starting to run Worker`);

            this.state = 'RUNNING';
            
            this.child = child_process.spawn(this.command, [], {
                shell: shell,
                detached: true,
                stdio: [ 'ignore', out, err ],
                cwd: executingDir,
                env: env
            });
            
            this.child.on('close', (code) => {
                this.finishExecution(code, res, rej);
            });
            
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

    finishExecution(code: number, res: (value?: string | PromiseLike<string> | undefined) => void, rej: (reason?: any) => void) {
        console.log(`[WORKER-${this.workerId}][STEP-${this.step}][LOG]: Worker finished with code ${code}`);

        // setting backup dir
        const location = config.projectLoaction + '/' + config.backupLocation + '/back-' + this.workerId;
        console.log(`[WORKER-${this.workerId}][STEP-${this.step}][LOG]: Backup-Location =  ${location}`);

        // check if a backup file location was set
        if (this.backupFilesLoc) {
            console.log(`[WORKER-${this.workerId}][STEP-${this.step}][LOG]: backup File Location specified need to move files.`);
            // move the backup files to the backup Location
            if (this.useCopy) {

                // copy the filloc dir to the backup dir
                fs.copy(this.backupFilesLoc, location, (err: any) => {
                    if(err) {
                        this.state = 'ERROR';
                        console.error(`[WORKER-${this.workerId}][ERROR]: Error while coping dir:  ${err}`);
                        rej('Error copying backup files into the backup folder!');
                    }

                    console.log(`[WORKER-${this.workerId}][STEP-${this.step}][LOG]: Copied backup files to backupLocation`);
                    this.finishUp(res, rej);
                });

            } else {
                // move the filloc dir to the backup dir
                fs.move(this.backupFilesLoc, location, (err: any) => {
                    if(err) {
                        this.state = 'ERROR';
                        console.error(`[WORKER-${this.workerId}][ERROR]: Error while moving dir:  ${err}`);
                        rej('Error copying backup files into the backup folder!');
                    }

                    console.log(`[WORKER-${this.workerId}][STEP-${this.step}][LOG]: Moved backup files to backupLocation`);
                    this.finishUp(res, rej);
                });
            }
        } else {
            this.finishUp(res, rej);
        }
    }


    finishUp(res: (value?: string | PromiseLike<string> | undefined) => void, rej: (reason?: any) => void) {
        if (this.child) {
            this.state = 'SUCCESS';
            this.child.unref();
            console.log(`[WORKER-${this.workerId}][STEP-${this.step}][LOG]: Worker finished running.`);
            res('SUCCESS');
        } else {
            this.state = 'ERROR';
            console.error(`[WORKER-${this.workerId}][ERROR]: Child process was not found.`);
            rej('The child process was not found');
        }
    }
}