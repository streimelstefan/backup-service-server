# What is this Software

This Software is the Server part of the Backup Software I am currently developing. The Server is not like a typical Server. It actually only runs the backup scripts you provided and provides a REST api to run/get and delete updates.

# First Setup

1. Get the Project files 
2. Make sure you have the newest version of Node.
   - You can download the newest version from [the Node Website](https://nodejs.org/en/)
3. Build the Project
   - ```npm run-script build```
4. Add the config file
   - For more information about the config file got to [Config](#Config)

# Config

Currently the config file needs to be located in the src folder after a build the file will than end up compiled in the build folder.
