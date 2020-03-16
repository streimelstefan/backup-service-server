
class Config {
    public user: User;
    public scripts: Script[];
    public logFilesLocation: string;
    public projectLoaction: string;
    public backupLocation: string;
    public minWaitTime: number;
    public runsInLinux: boolean; 

    constructor () {
        this.projectLoaction = process.cwd();
        this.user = {id: '', pwd: ''};
    }

    public setUser(id: string, pwd: string) {
        if (id.length <= 10) {
            console.error('[CONFIG][USER][ERROR]: The user id is to short please enter an id that is longer than 10 chars!');
            process.exit(1);
        } else if (id.length <= 20) {
            console.warn('[CONFIG][USER][WARN]: The user id is shorter than 20 chracters it is advised to make the id larger than 20 characters!');
        }

        if (pwd.length <= 10) {
            console.error('[CONFIG][USER][ERROR]: The user pwd is to short please enter an pwd that is longer than 10 chars!');
            process.exit(1);
        } else if (pwd.length <= 20) {
            console.warn('[CONFIG][USER][WARN]: The user pwd is shorter than 20 chracters it is advised to make the pwd larger than 20 characters!');
        }

        this.user.id = id;
        this.user.pwd = pwd;
    }

    public setScirpts(scripts: Script[]) {
        try {
            if (scripts.length < 1) {
                throw "There are no scripts defined please add at least one!";
            }

            scripts.forEach((script: Script) => {
                if (script.msscript && script.command) {
                    throw "It is not allowed that a script has a comand and a msscript field!";
                }

                if (script.useCopy && !script.outputDir) {
                    throw "The useCopy field is only allowed if the outputDir was specified";
                }

                if (script.msscript) {
                    if (script.msscript.length < 1) {
                        throw "The msscript field is not allowed to be empty";
                    }

                    script.msscript.forEach((scriptCon: ScriptConfig) => {
                        if (!scriptCon.command) {
                            throw "A msscript step needs to have a command!";
                        }

                        if (scriptCon.useCopy && !scriptCon.outputDir) {
                            throw "The useCopy field is only allowed if the outputDir was specified";
                        }
                    });
                } else if (!script.command) {
                    throw "no msscript or command found please add at least one!";
                }
            });

            // add the scripts to the config
            this.scripts = scripts;
       } catch (error) {
            console.error('[CONFIG][SCRIPT][ERROR]: ' + error);
            process.exit(1);
        }
    }

    public setlogFilesLocation(location: string | null) {
        if (typeof location === 'string' || location === null) {

            if (location === null) {
                this.logFilesLocation = 'logs';
            } else {
                this.logFilesLocation = location;
            }
        } else{
            console.error('[CONFIG][TIMEOUT][LOGFILELOC]: The logFilesLocation needs to be a string or not specified!');
            process.exit(1);
        }
    }

    public setBackupLocation(location: string | null) {
        if (typeof location === 'string' || location === null) {

            if (location === null) {
                this.backupLocation = 'backup';
            } else {
                this.backupLocation = location;
            }
        } else {
            console.error('[CONFIG][TIMEOUT][BACKUPLOC]: The backuptLocation needs to be a string or not specified!');
            process.exit(1);
        }
    }

    public setMinTimeOut(timeout: number | null) {
        if (typeof timeout === 'number' || timeout === null) {

            if (!timeout) {
                this.minWaitTime = 60000;
            } else if (timeout < 60000) {
                this.minWaitTime = 60000;
            } else {
                this.minWaitTime = timeout;
            }
        } else {
            console.error('[CONFIG][TIMEOUT][ERROR]: The minWaitTimeout needs to be a number or not specified!');
            process.exit(1);
        }
    }

    public setRunsInLinux(linux: boolean | null) {
        if (typeof linux === 'boolean' || linux === null) {

            if (linux === null) {
                this.runsInLinux = true;
            } else {
                this.runsInLinux = linux;
            }
        } else {
            console.error('[CONFIG][LINX?][ERROR]: The runsInLinux fields needs to be a boolean or not specified!');
            process.exit(1);
        }
    }
}

interface User {
    id: string;
    pwd: string;
}

interface Script {
    msscript?: ScriptConfig[];
    command?: string;
    outputDir?: string;
    useCopy?: boolean;
    executingDir?: string;
    envirement?: EnvirementPart[];
    commandOnly?: boolean;
}

interface ScriptConfig {
    command: string;
    outputDir?: string;
    useCopy?: boolean;
    executingDir?: string;
    envirement?: EnvirementPart[];
    commandOnly?: boolean;
}

interface EnvirementPart {
    value: string;
    key: string;
}


let config = new Config();

export = config;