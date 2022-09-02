const { createServer } = require('http');
const { Server } = require('socket.io');
const Game = require('./Game.js');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5500',
  },
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
    socket.emit('request accepted', 'HELLO');
    clients[id].emit('request accepted', 'HELLO');
    const game = new Game(clients[id], socket);
    clients[id].game = game;
    socket.game = game;
    game.startGame();
  });

  socket.on('reject request', id => {
    clients[id].emit('request rejected', client.name);
  });

  socket.on('disconnect', () => {
    console.log(socket.userName, 'disconnected');
    io.emit('client disconnected', socket.id, onlineClients);
    delete clients[socket.id];
  });
});

function reset(id1, id2) {
  clients[id1].opponent = undefined;
  clients[id2].opponent = undefined;
}

const PORT = 3000;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
