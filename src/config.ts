const config = {
    user: {
        id: "uijknvkladjfkdlfwfdbfnjhuisfjklbcnmakhdfgjdklsa",
        pwd: "fdhajkl2bf8doasvbjfoaz72381bfhjdkashf3u1iobfhdjask"
    },
    scripts: [
        {
            command: "mkdir testFolder",
            outputDir: 'C:/Temp',
            useCopy: true,
            executingDir: 'C:/Temp',
            envirement: [
                {
                    key: 'xyz',
                    value: 'test'
                }
            ]
        },
        {
            msscript: [
                {
                    command: "mkdir testFolder",
                    outputDir: 'C:/Temp',
                    useCopy: false,
                    executingDir: 'C:/Temp',
                    envirement: [
                        {
                            key: 'xyz',
                            value: 'test'
                        }
                    ]
                }, { 
                    command: "mkdir testFolder1",
                    outputDir: 'C:/Temp',
                    useCopy: false,
                    executingDir: 'C:/Temp',
                    envirement: [
                        {
                            key: 'xyz',
                            value: 'test'
                        }
                    ]
                }
            ],
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