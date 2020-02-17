const config = {
    user: {
        id: "uijknvkladjfkdlfwfdbfnjhuisfjklbcnmakhdfgjdklsa",
        pwd: "fdhajkl2bf8doasvbjfoaz72381bfhjdkashf3u1iobfhdjask"
    },
    scripts: [
        {
            script: "echo {{BACKUP_LOCATION}}/{{BACKUP_FILE_NAME}}"
        }
    ],
    logFilesLocation: 'logs',
    projectLoaction: '',
    backupLocation: 'backup'
}

module.exports = config;