var express = require('express');
var router = express.Router();

// get records
router.get('/', async (req, res) => {
	const keys = await redis.keys('*');
	const records = await redis.mget(keys);
	const output = keys.map((key, i) => ({deviceid: key, value: JSON.parse(records[i])}))
	res.send(output);
});

module.exports = router;
