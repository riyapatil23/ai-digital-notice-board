let ioInstance = null;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.CLIENT_URL || 'http://localhost:3000'
      ],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // User joins their private room by userId
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        // console.log(`Socket ${socket.id} joined user room: ${userId}`);
      }
    });

    socket.on('leave', (userId) => {
      if (userId) {
        socket.leave(userId.toString());
      }
    });

    socket.on('disconnect', () => {
      // Disconnected cleanly
    });
  });

  ioInstance = io;
  return io;
};

const getIO = () => ioInstance;

const emitNotificationToUser = (userId, notification) => {
  if (ioInstance && userId) {
    ioInstance.to(userId.toString()).emit('new_notification', notification);
    ioInstance.to(userId.toString()).emit('notification_count_updated');
  }
};

module.exports = { initSocket, getIO, emitNotificationToUser };
