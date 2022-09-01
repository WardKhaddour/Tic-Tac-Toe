const { createServer } = require('http');
const { Server } = require('socket.io');

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

  socket.on('disconnect', () => {
    socket.broadcast.emit('client disconnected', socket.id);
    delete clients[socket.id];
  });
});

const PORT = 3000;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
