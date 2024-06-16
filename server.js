const express = require("express");
const app = express();
const { v4: uuidv4 } = require("uuid");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.set("view engine", "ejs");
app.use(express.static("public"));  
app.use('/peerjs', peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  console.log('a user connected');
  socket.on("join-room", (roomId, userId) => {
    console.log(`User ${userId} joined room ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
    socket.on('message',message=>{
      io.to(roomId).emit('createMessage',message); 
    });
    socket.on("leave-room", (roomId, userId) => {
      console.log(`User ${userId} left room ${roomId}`);
      socket.to(roomId).emit('user-disconnected', userId);
      socket.leave(roomId);
    });
    socket.on('disconnect', (roomId, userId) => {
      console.log(`User ${userId} disconnected`);
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

const PORT = 443;
server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
