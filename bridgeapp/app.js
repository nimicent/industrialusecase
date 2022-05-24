const createError = require('http-errors'),
  express = require('express'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  logger = require('morgan'),
  mqtt = require('mqtt'),
  Redis = require('ioredis'),
  cors = require('cors'),
  tls = require('tls'), 
  fs = require('fs');

require('dotenv').config()
const app = express();

// connect to Redis
const redis = new Redis({
  host: process.env.REDIS_SERVICE_HOST,
  port: process.env.REDIS_SERVICE_PORT,
  // db: 0
});

global.redis = redis;

redis.on('connect', () => {
  console.log(' redis client connected');
});

// connect to MQTT
let client = mqtt.connect('mqtt://mosquitto-ephemeral-tcp', {username:'admin', password: 'admin'})

client.on('error', (err) => { console.log(err) })

// subscribe to topic
client.on('connect', function () {
  client.subscribe('sensors', function (err) {
    /*if (!err) {
      client.publish('sensors', 'Hello mqtt 123 julia') //this needs to be sending messages that come from the Node-Red app onto being forwarded to Redis...
      console.log('mqtt sensors topic demo publish connected==>>');
    }*/
  });
})

// forward message to redis
client.on('message', async (topic, message) => {
  try {
    if (topic === 'sensors') {
      const payload = JSON.parse(message.toString());
      if (Array.isArray(payload)) {
        await Promise.all(payload.map(reading => redis.set(reading.deviceid, JSON.stringify(reading))));
      } else {
        await redis.set(payload.deviceid, JSON.stringify(payload));
      }
    }
  } catch(err) {
    console.log('error is ', err);
  }
});

/*(async () => {
  await redis.set('hey', 'testing');
  const hey = await redis.del('hey'); 
  console.log('hey', hey)
})()*/

//routes
const indexRouter = require('./routes/index');
const readingsRouter = require('./routes/readings');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/readings', readingsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log('origin is ', req.originalUrl, 'path is ', req.path)
  // next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const port = 8080,
  host = '0.0.0.0';

app.listen(port, host);
console.log(`Running on http://${host}:${port}`);

module.exports = app;