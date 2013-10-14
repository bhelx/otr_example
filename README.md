### OTR web-chat example

This is an example chat application that uses OTR for end-to-end encryption and the socialist millionaire protocol for verification.

It's a full web application, backend and front end, to create temporary chat rooms encrpyted with OTR.

The backend is node/express and redis. Express is used to serve the application and redis is used as a session storage and pub/sub interface for the socket.io communication. This allows you to have people connected to multiple instances of your application whils still communicating with each other.

The frontend is socket.io, otr.js, and some crappy jquery/html.

Do not use this in life or death situations.

### Installing/Running

For local:

```
npm install
node app
```

For Heroku:

All you need is a redis-to-go add on. The Procfile is there.

