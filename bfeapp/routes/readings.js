var express = require('express');
var router = express.Router();

// Get the query param deviceId
router.get('/', async (req, res) => {
	const deviceId = req.query.deviceId
	const record =  await redis.get(deviceId).catch(err => new Error(err));

	const output = { deviceId, value: JSON.parse(record)}


	res.json(output);
});

module.exports = router;

