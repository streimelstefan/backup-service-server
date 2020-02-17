const express = require('express');
const router = express.Router();
const config = require('../config');

router.route('')
    .get((req, res) => {
        if (req.session.authenticated) {
            console.log('The User is Authenticated');
            res.status(200).send(config.scripts).end();
        } else {
            console.error('The User is not Authenticated');
            res.status(403).send({desc: 'Please Authenticate first'}).end();
        }
    });

router.get(':id', (req, res) => {
    console.log(`User wants to request: ${req.params.id}`);
});

module.exports = router;