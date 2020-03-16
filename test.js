

const config = {
    user: {
        id: "uijknvkladjfkdlfwfdbfnjhuisfjklbcnmakhdfgjdklsa",
        pwd: "fdhajkl2bf8doasvbjfoaz72381bfhjdkashf3u1iobfhdjask"
    },
    scripts: [
        {
            command: "/opt/mailcow-dockerized/helper-scripts/backup_and_restore.sh backup all",
            outputDir: '/opt/backup-email',
            useCopy: false,
            envirement: [
                {
                    key: 'MAILCOW_BACKUP_LOCATION',
                    value: '/opt/backup-email'
                }
            ]
        },
        {
            msscript: [
                {
                    command: "docker exec -t gitlab gitlab-backup create",
                    outputDir: "/srv/gitlab/data/backups",
                    useCopy: false
                },
                {
                    command: "cp -r -t /opt/backup-gitlab-2/ /srv/gitlab/config/",
                    outputDir: "/opt/backup-gitlab-2",
                    useCopy: false
                }
            ]
        }, 
        {
            msscript: [
                {
                    command: "sudo -u www-data php7.2 occ maintenance:mode --on",
                    executingDir: "/var/www/nextCloud",
                    commandOnly: true
                },
                {
                    command: "echo Copying the data",
                    outputDir: "/opt/nextCloud/",
                    useCopy: true
                },
                {
                    command: "echo Copying the config folder",
                    outputDir: "/var/www/nextCloud/config",
                    useCopy: true
                },
                {
                    command: "echo Copying the themes folder",
                    outputDir: "/var/www/nextCloud/themes",
                    useCopy: true
                },
                {
                    command: "mysqldump --single-transaction -h [server] -u [username] -p[password] [db_name] > nextcloud-sqlbkp_`date + \"%Y%m%d\"`.bak",
                    executingDir: "/opt/nextCloud"
                },
                {
                    command: "sudo -u www-data php7.2 occ maintenance:mode --off",
                    executingDir: "/var/www/nextCloud",
                    commandOnly: true
                }
            ]
        }
    ],
    logFilesLocation: 'logs',
    backupLocation: 'backup',
    minWaitTime: 60000,
    runsInLinux: true
}

module.exports = config;
