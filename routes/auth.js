const express = require('express');
const router = express.Router();
const config = require('../config');

router.route('/login')
    .post((req, res) => {
        // because the application will always only have one user there is no need for complecated authentication
        // so I'm just checking if the id and the pwd are the same as the ones provided in the config
        console.log(`Checking if the user used the right credentials: ${JSON.stringify(req.body)}`);
        if (req.body.uid === config.user.id && req.body.pwd === config.user.pwd) {
            console.log('The user is authenticated!');
            req.session.authenticated = true;
            res.status(200).send({desc: 'Authentication sucessfull!'}).end();
        } else {
            console.error('The user entered the wrong credentials!');
            res.status(401).send({desc: 'Wrong Credentials'}).end();
        }
    });

module.exports = router;