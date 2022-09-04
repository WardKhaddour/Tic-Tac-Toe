const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'https://tic-tac-toe-22.glitch.me'],
  },
});

const Game = require(`${__dirname}/Game.js`);
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: __dirname });
});

io.use((socket, next) => {
  const userName = socket.handshake.auth.userName;
  if (!userName) {
    return next(new Error('invalid  name'));
  }
  socket.userName = userName;
  next();
});

const clients = {};

io.on('connection', socket => {
  const onlineClients = [];
  for (let [id, socket] of io.of('/').sockets) {
    onlineClients.push({
      id: id,
      name: socket.userName,
    });
  }
  socket.emit('online clients', onlineClients);
  clients[socket.id] = socket;
  const client = { id: socket.id, name: clients[socket.id].userName };
  socket.broadcast.emit('client connected', client);

  socket.on('play against user', id => {
    const user = {
      id: socket.id,
      name: socket.userName,
    };
    clients[id].emit('playing request', user);
  });

  socket.on('accept request', id => {
    clients[id].opponent = clients[socket.id];
    clients[socket.id].opponent = clients[id];
    socket.emit('request accepted');
    clients[id].emit('request accepted');
    const game = new Game(clients[id], socket);
    clients[id].game = game;
    socket.game = game;
    game.startGame();
  });

  socket.on('reject request', id => {
    clients[id].emit('request rejected', client.name);
  });

  socket.on('message', data => {
    const { message, sender } = data;
    clients[socket.id].opponent.emit('new message', {
      message,
      fromMe: false,
      sender,
    });
  });

  socket.on('disconnect', () => {
    io.emit('client disconnected', socket.id, onlineClients);
    delete clients[socket.id];
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT);
