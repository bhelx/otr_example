var express     = require('express')
  , app         = express()
  , server      = require('http').createServer(app)
  , io          = require('socket.io').listen(server)
  , redis       = require("redis")
  , storeClient = redis.createClient()
  , pubClient   = redis.createClient()
  , subClient   = redis.createClient()
  ;

server.listen(3000);
app.use(express.static(__dirname + '/public'));

io.configure( function(){
  io.enable('browser client minification'); // send minified client
  io.enable('browser client etag'); // apply etag caching logic based on version number
  io.enable('browser client gzip'); // gzip the file
  io.set('log level', 1); // reduce logging
  io.set('transports', [ // enable all transports (optional if you want flashsocket)
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

io.sockets.on('connection', function (socket) {

  var room = "";
  socket.on('join', function (data, fn) {
    fn({ msg: "Hello " + data.nick});
    socket.join(data.room);
    room = data.room;
    socket.broadcast.to(room).json.send({ type: 'connection', data: data });
  });

  socket.on('message', function (message, fn) {
    socket.broadcast.to(room).json.send(message);
    fn(message);
  });

  socket.on('disconnect', function(){
    socket.broadcast.to(room).json.send({ type: 'disconnection', msg: 'User has disconnected' });
  });

});

subClient.psubscribe("chat.*");
