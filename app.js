var express     = require('express')
  , app         = express()
  , server      = require('http').createServer(app)
  , io          = require('socket.io').listen(server)
  , redis       = require("redis")
  , storeClient = redis.createClient()
  , pubClient   = redis.createClient()
  , subClient   = redis.createClient()
  , crypto      = require('crypto')
  ;

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
  var RedisStore = require('socket.io/lib/stores/redis');
  io.set('store', new RedisStore({
    redisPub: pubClient,
    redisSub: subClient,
    redisClient: storeClient
  }));
});

function createRoom (done) {
  crypto.randomBytes(32, function (ex, buf) {
    if (ex) throw ex;
    done(buf.toString('hex'));
  });
}

io.sockets.on('connection', function (socket) {

  var room = "";

  socket.on('join', function (data, fn) {
    function onJoin (room) {
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
