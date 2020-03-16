import * as express from 'express';
import { Request, Response } from 'express-serve-static-core';
const router = express.Router();
import config = require('../classes/config.class');
import { Worker } from '../classes/worker.class';

router.route('')
    .get((req: Request, res: Response) => {
        if (req!.session!.authenticated) {
            console.log('[ROUTE][LOG][v1/scripts]: The User is Authenticated');

            let data = [];

            for (let i = 0; i < config.scripts.length; i++) {
                data.push({id: i, ...config.scripts[i]});
            }

            res.status(200).json(data).end();
        } else {
            console.error('[ROUTE][ERROR][v1/scripts]: The User is not Authenticated');
            res.status(401).json({desc: 'Please Authenticate first'}).end();
        }
    });

router.get('/:id', (req: Request, res: Response) => {
    if (req!.session!.authenticated) {
        const id = req.params.id as unknown as number;

        console.log(`[ROUTE][LOG][v1/scripts/:id]: User wants to request: ${id}`);

        if (isNaN(id)) {
            console.error('[ROUTE][ERROR][v1/scripts/:id]: User did not use a number as id.');
            res.status(400).json({desc: 'The id needs to be a number!'}).end();
        } else if (id > config.scripts.length - 1) {
            console.error('[ROUTE][ERROR][v1/scripts/:id]: User id is out of bounds');
            res.status(400).json({desc: 'The id is higher than the highest id.'}).end();
        } else if (id < 0) {
            console.error('[ROUTE][ERROR][v1/scripts/:id]: User id is negative.');
            res.status(400).json({desc: 'The id needs to be positive'}).end();
        } else {
            console.log(`[ROUTE][LOG][v1/scripts/:id]: Sending data: ${config.scripts[id]}`);
            res.status(200).json({id: req.params.id, ...config.scripts[id]}).end();
        }

    } else {
        console.error('[ROUTE][ERROR][v1/scripts/:id]: The User is not authenticated');
        res.status(401).json({desc: 'Please Authenticate first'}).end();
    }
});

router.post('/:id/register', (req: Request, res: Response) => {
    console.log(req.cookies);
    if (req!.session!.authenticated) {
        const sid = req.params.id as unknown as number;

        console.log(`[ROUTE][LOG][v1/scripts/:id/register]: User wants to register: ${sid}`);

        if (isNaN(sid)) {
            console.error('[ROUTE][ERROR][v1/scripts/:id/register]: User did not use a number as id.');
            res.status(400).json({desc: 'The id needs to be a number!'}).end();
        } else if (sid > config.scripts.length - 1) {
            console.error('[ROUTE][ERROR][v1/scripts/:id/register]: User id out of bounds.');
            res.status(400).json({desc: 'The id is higher than the highest id.'}).end();
        } else if (sid < 0) {
            console.error('[ROUTE][ERROR][v1/scripts/:id/register]: User id is lower than 0');
            res.status(400).json({desc: 'The id needs to be positive'}).end();
        } else {
            console.log(`[ROUTE][LOG][v1/scripts/:id/register]: Starting data: ${JSON.stringify(config.scripts[sid])}`);

            const id = Worker.getNewWorkerId();

            let useCopy: boolean | undefined | null = config.scripts[sid].useCopy;
            if (useCopy === undefined) {
                useCopy = null;
            }

            const worker = new Worker(id,
                config.logFilesLocation,
                config.logFilesLocation,
                config.scripts[sid].outputDir || null,
                useCopy,
                config.scripts[sid].executingDir || null,
                config.scripts[sid].envirement || null,
                config.scripts[sid].commandOnly || false && config.scripts[sid].command || false
            );

            if (config.scripts[sid].command) {

                worker.addStep(config.scripts[sid].command || '', null, null, null, null, config.scripts[sid].commandOnly || false);

            } else {

                config.scripts[sid].msscript?.forEach(step => {
                    worker.addStep(
                        step.command,
                        step.outputDir || null,
                        step.useCopy || null,
                        step.executingDir || null,
                        step.envirement || null,
                        step.commandOnly || false
                    );
                });

            }

            Worker.addWorkerToList(worker);

            console.log(`[ROUTE][LOG][v1/scripts/:id/register]: Registered Worker: ${JSON.stringify(Worker.getWorkerWithId(id))}`);
            console.log(`[ROUTE][LOG][v1/scripts/:id/register]: Worker id: ${id}`);

            res.status(200).json({workerId: id, executing: worker.steps}).end();
        }

    } else {
        console.error('The User is not authenticated');
        res.status(401).json({desc: 'Please Authenticate first'}).end();
    }
});

export = router;