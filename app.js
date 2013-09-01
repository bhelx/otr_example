var express = require('express')
  , app     = express()
  , server  = require('http').createServer(app)
  , io      = require('socket.io').listen(server)
  , redis   = require("redis")
  , crypto  = require('crypto')
  ;

if (process.env.REDISTOGO_URL) {
  var rtg = require("url").parse(process.env.REDISTOGO_URL);

  var createClient = function () {
    return redis.createClient(rtg.port, rtg.hostname, { auth_pass: rtg.auth.split(":")[1] });
  }

  var storeClient = createClient();
  var pubClient = createClient();
  var subClient = createClient();
} else {
  var storeClient = redis.createClient()
    , pubClient   = redis.createClient()
    , subClient   = redis.createClient()
    ;
}

server.listen(3000);
app.use(express.static(__dirname + '/public'));

io.configure( function (){
  io.enable('browser client minification');
  io.enable('browser client etag');
  io.enable('browser client gzip');
  io.set('log level', 1);
  io.set('transports', [
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ]);
  storeClient.on('ready', function () {
    var RedisStore = require('socket.io/lib/stores/redis');
    io.set('store', new RedisStore({
      redisPub: pubClient,
      redisSub: subClient,
      redisClient: storeClient
    }));
  });
});

var createRoom = function (done) {
  crypto.randomBytes(32, function (ex, buf) {
    if (ex) throw ex;
    done(buf.toString('hex'));
  });
}

io.sockets.on('connection', function (socket) {

  var room = "";

  socket.on('join', function (data, fn) {
    var onJoin = function (room) {
      fn({ type: 'connection', data: { room: room } });
      room = room;
      socket.join(room);
      socket.broadcast.to(room).json.send({ type: 'connection', data: data });
    }
    if (data.room) {
      onJoin(data.room);
    } else {
      createRoom(onJoin);
    }
  });

  socket.on('message', function (message, fn) {
    socket.broadcast.to(room).json.send(message);
    fn(message);
  });

  socket.on('disconnect', function (){
    socket.broadcast.to(room).json.send({ type: 'disconnection', msg: 'User has disconnected' });
  });

});

subClient.psubscribe("chat.*");
