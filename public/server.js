const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const batteryIdMap = require('./batteryIdMap');

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname)));

app.get('/:batteryId', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/battery/:batteryId', async (req, res) => {
    const customBatteryId = req.params.batteryId;

    // Translate custom ID to real ID
    const realBatteryId = batteryIdMap[customBatteryId];
    if (!realBatteryId) {
        return res.status(404).json({ error: "Battery ID not found" });
    }

    const myHeaders = {
        "Authorization": "Basic VmxhZFZhbGNoa292OlZWMTIxMg==",
        "Content-Type": "application/json"
    };

    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        credentials: 'include',
        redirect: 'follow'
    };

    try {
        const response = await fetch("https://developer.chargenow.top/cdb-open-api/v1/order/list?page=1&limit=100", requestOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();

        if (!result.page || !result.page.records) {
            throw new Error("Invalid API response structure");
        }

        // Find record matching real battery ID
        const matchingRecord = result.page.records.find(record => record.pBatteryid === realBatteryId);
        if (matchingRecord) {
            res.json(matchingRecord);
        } else {
            res.status(404).json({ error: "Battery not found in API data" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});

