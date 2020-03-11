declare function require(path: string): any;
const fs = require('fs-extra');
import config = require('../classes/config.class');
import child_process = require('child_process');
import { SubWorker } from './subWorker.class';
const zipper = require("zip-local");

export class Worker {

    private static wokers = new Array<Worker>(0);

    public workerId: number;
    public state: 'PASSIVE' | 'RUNNING' | 'ERROR' | 'READY' | 'SUCCESS';
    public logOutPutDir: string;
    public errOutPutDir: string;
    public backupFilesLoc: string | null;
    public useCopy: boolean | null;
    public executingDir: string | null;
    public env: {key: string, value: string}[] | null;

    public steps: SubWorker[];

    public constructor (
        workerId: number,
        logOutPutDir: string,
        errOutPutDir: string,
        backupFilesLoc: string | null,
        useCopy: boolean | null,
        executingDir: string | null,
        env: {key: string, value: string}[] | null
        ) {
        this.workerId = workerId;
        this.state = 'PASSIVE';
        this.logOutPutDir = logOutPutDir;
        this.errOutPutDir = errOutPutDir;
        this.backupFilesLoc = backupFilesLoc;
        this.useCopy = useCopy;
        this.executingDir = executingDir;
        this.env = env;

        this.steps = new Array<SubWorker>();
    }

    public addStep(
        command: string,
        backupFilesLoc: string | null,
        useCopy: boolean | null,
        executingDir: string | null,
        env: {key: string, value: string}[] | null
    ) {
        console.log(`[WORKER-${this.workerId}][ADDSTEP][LOG]: Adding step ${this.steps.length}`);

        const step = new SubWorker(
            command,
            this.workerId,
            this.logOutPutDir,
            this.errOutPutDir,
            backupFilesLoc || this.backupFilesLoc,
            useCopy || this.useCopy,
            executingDir || this.executingDir,
            env || this.env,
            this.steps.length
        );

        this.steps.push(step);
        console.log(`[WORKER-${this.workerId}][ADDSTEP][LOG]: Finished adding step ${this.steps.length}`);
    }

    public runWorker() {
        console.log(`[WORKER-${this.workerId}][LOG]: Starting to run Worker`);

        this.state = 'RUNNING';

        if (fs.existsSync(`${this.logOutPutDir}/out-${this.workerId}.log`)) {
            fs.unlinkSync(`${this.logOutPutDir}/out-${this.workerId}.log`);
        }
        if (fs.existsSync(`${this.errOutPutDir}/errout-${this.workerId}.log`)) {
            fs.unlinkSync(`${this.errOutPutDir}/errout-${this.workerId}.log`);
        }

        this.runStepWithIndex(0);
    }

    private runStepWithIndex(index: number) {
        if (index < this.steps.length) {
            const step = this.steps[index];

            step.runWorker().then((res: string) => {
                if (res === "SUCCESS") {
                    index += 1;
                    this.runStepWithIndex(index);
                } else {
                    console.log('Strims you fucked up xD');
                }
            }).catch((err: any) => {
                console.error(`[WORKER-${this.workerId}][ERROR]: There was an Error in step ${index + 1}: ${err}`);
                console.error(`[WORKER-${this.workerId}][ERROR]: The worker will stop running now!`);
                this.state = 'ERROR';
                step.child?.unref();
            });
        } else {
            console.log(`[WORKER-${this.workerId}][LOG]: All steps finished`);

            const location = config.projectLoaction + '/' + config.backupLocation + '/back-' + this.workerId;
            console.log(`[WORKER-${this.workerId}][LOG]: Backup-Location =  ${location}`);
            this.archiveBackupData(location);
            this.finishUp();
        }
    }

    private archiveBackupData(location: string) {
        console.log(`[WORKER-${this.workerId}][LOG]: Starting to Archive backup-data`);
        // Archiving the backup dir
        addDirToArchive(location, `${config.projectLoaction}/${config.backupLocation}/backup-${this.workerId}.zip`, `[WORKER-${this.workerId}][LOG]:`);
    }

    private finishUp() {
        this.state = 'SUCCESS';
        console.log(`[WORKER-${this.workerId}][LOG]: Worker finished running.`);

        setTimeout(() => {
            console.log(`[WORKER-${this.workerId}][LOG]: Releasing Worker.`);
            this.state = 'PASSIVE'
        }, config.minWaitTime);
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
