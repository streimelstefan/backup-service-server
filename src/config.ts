const config = {
    user: {
        id: "uijknvkladjfkdlfwfdbfnjhuisfjklbcnmakhdfgjdklsa",
        pwd: "fdhajkl2bf8doasvbjfoaz72381bfhjdkashf3u1iobfhdjask"
    },
    scripts: [
        {
            script: "mkdir testFolder",
            outputDir: 'C:/Temp',
            useCopy: true,
            executingDir: 'C:/Temp',
            envirement: [
                {
                    key: 'xyz',
                    value: 'test'
                }
            ]
        }
    ],
    logFilesLocation: 'logs',
    projectLoaction: '',
    backupLocation: 'backup',
    minWaitTime: 10000,
    runsInLinux: false
}

export = config;