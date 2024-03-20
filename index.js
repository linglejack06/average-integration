const express = require('express');
const cors = require('cors');
require('dotenv').config();
const addAllAverages = require('./addAllAverages');

const app = express();

app.use(cors());

app.post('/updateAverages/:eventName', async (req, res, next) => {
    try {
        await addAllAverages(req.params.eventName);
        return res.status(201);
    } catch (error) {
        return res.status(400).send(error.message);
    }
})

app.listen(process.env.PORT, () => {
    console.log(`Server started at ${process.env.PORT}`)
})
