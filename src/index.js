// server.js (atau file backend utama kamu)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const onlineUsers = new Map();
const io = new Server(server, {
  cors: {
   origin: "ikhsandwisaputra.github.io/yu-chat/",// Ganti dengan URL frontend React kamu
    methods: ["GET", "POST"],
  },
});

const getOnlineUsers = () => {
  // Kirim daftar userId yang online
  return Array.from(onlineUsers.keys());
};
io.on('connection', (socket) => {
  
  console.log(`User Connected: ${socket.id}`);
 socket.on('user_online', (userId) => {
    onlineUsers.set(userId, socket.id);
    // Kirim update ke semua klien bahwa ada user baru yang online
    io.emit('update_online_users', getOnlineUsers());
  });
  // Bergabung ke room
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // Mengirim pesan
// VERSI BARU (BENAR)
socket.on('send_message', (data) => {
  // Jika klien mengirim objek { room, message }
  if (data.room && data.message) {
    socket.to(data.room).emit('receive_message', data.message);
  } else {
    // Jika klien mengirim objek pesan datar { ..., room }
    // Ini adalah fallback jika Anda mengikuti tutorial saya yang lebih baru
    const { room, ...messageData } = data;
    socket.to(room).emit('receive_message', messageData);
  }
});

  // Meninggalkan room
  socket.on('leave_room', (room) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room: ${room}`);
  });

  socket.on('disconnect', () => {
    // Cari userId berdasarkan socket.id
    let disconnectedUserId = null;
    for (const [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
      // Kirim update ke semua klien bahwa ada user yang offline
      io.emit('update_online_users', getOnlineUsers());
    }
    console.log(`User Disconnected: ${socket.id}`);
  });

  socket.on('typing_start', ({ room }) => {
  // Mengirim event 'friend_is_typing' ke semua client di room kecuali si pengirim
  socket.to(room).emit('friend_is_typing');
});

socket.on('typing_stop', ({ room }) => {
  // Mengirim event 'friend_stopped_typing' ke semua client di room kecuali si pengirim
  socket.to(room).emit('friend_stopped_typing');
});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});