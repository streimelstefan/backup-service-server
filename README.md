# What is this Software

This Software is the Server part of the Backup Software I am currently developing. The Server is not like a typical Server. It actually only runs the backup scripts you provided and provides a REST api to run/get and delete updates.

# How it works
You get the files of the last release unpack them and the edit the provieded config.js. 

```javascript

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
    backupLocation: 'backup'
}

```

## user

In the User Object you need to input the id and password, with wich the client later needs to login the acces the rest api.

## scripts

The scirpts array holds all the scripts the server can execute. It holds objects with a script attribute which represents the bash script the server should call when the call for the script is made.

## logFilesLocation

Tells the server where it should place down the logs off all the scripts. The path should be relative to the projects location. Logs are saved like *log-{scriptID}.log*.

## backupLocation

Is the location where **all** backup files are located. The backup should actually be in the the directory: 

*{backupLocation}/backup-{workerId}/*

The Server will then take all the files of that folder and zip them up. This zip file can than be downloaded.

